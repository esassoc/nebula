.PHONY: help auth start stop api web api-test web-test web-build web-lint database download restore build scaffold gen-models

WORKSPACE := /workspace
BUILD_DIR := $(WORKSPACE)/Build
API_PORT ?= 12160
WEB_PORT ?= 12162

help: ## Show available targets
	@grep -E '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

auth: ## One-time sign-in to Azure (az) + GitHub (gh); persists in shared volumes
	cd $(BUILD_DIR) && bash auth.sh

# --- Run ---

start: stop ## Start the API and web dev server in parallel (frees stale ports first)
	@trap 'kill 0' EXIT; \
	$(MAKE) api & \
	$(MAKE) web & \
	wait

stop: ## Kill stray API/web dev servers from a previous run
	@echo "Freeing dev ports (killing any stray watchers/servers from a previous run)..."
	-@pkill -9 -f "Nebula\.API" 2>/dev/null
	-@pkill -9 -f "ng serve" 2>/dev/null
	@sleep 1

api: ## Start the API with hot-reload on port $(API_PORT)
	cd $(WORKSPACE) && dotnet watch --project Nebula.API -- run --urls http://+:$(API_PORT)

web: ## Start the Angular dev server on port $(WEB_PORT)
	cd $(WORKSPACE)/Nebula.Web && npx --yes ng serve --host 0.0.0.0 --port $(WEB_PORT) --poll 2000

# --- Test / lint ---

api-test: ## Run .NET tests
	cd $(WORKSPACE) && dotnet test Nebula.Tests/Nebula.Tests.csproj

web-test: ## Run Angular unit tests
	cd $(WORKSPACE)/Nebula.Web && npm test

web-build: ## Build Angular for production
	cd $(WORKSPACE)/Nebula.Web && npm run build-prod

web-lint: ## Lint Angular code
	cd $(WORKSPACE)/Nebula.Web && npm run lint

# --- Database / codegen ---

database: ## Database context (see the notes below)
	@echo ""
	@echo "  Database and codegen currently run from WINDOWS, not this container:"
	@echo ""
	@echo "    Build/DatabaseDownload.ps1   download BACPAC from Azure"
	@echo "    Build/DatabaseRestore.ps1    restore from BACPAC"
	@echo "    Build/DatabaseBuild.ps1      build DacPac and deploy schema"
	@echo "    Build/Scaffold.ps1           regenerate EF entities + TS enums"
	@echo ""
	@echo "  See 'make scaffold' for why."
	@echo ""

scaffold: ## (host-only) Explains why codegen cannot run in this container
	@echo ""
	@echo "  Scaffold.ps1 must be run from Windows, not the devcontainer:"
	@echo ""
	@echo "    * it uses the Scaffold-DbContext PowerShell cmdlet"
	@echo "    * it shells out to a Windows EFCorePOCOGenerator.exe"
	@echo "      (Build/efcorepocogenerator, a git submodule)"
	@echo ""
	@echo "  Porting it to bash is tracked separately. wave-runup's"
	@echo "  Build/scaffold.sh only replaces the 'dotnet ef' half, which is not"
	@echo "  sufficient here."
	@echo ""
	@echo "  Also note: Nebula.Models/DataTransferObjects/EntityDtos is"
	@echo "  HAND-MAINTAINED. Current EFCorePOCOGenerator versions no longer"
	@echo "  emit C# DTOs, so a schema change needs a manual DTO edit."
	@echo ""
	@exit 1

gen-models: ## Regenerate the TypeScript API client from Nebula.API/swagger.json
	cd $(WORKSPACE)/Nebula.Web && npm run gen-model
