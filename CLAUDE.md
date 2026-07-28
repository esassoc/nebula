# Nebula - Smart Watershed Network Platform

## Project Overview
A water resources management platform built with an ASP.NET Core 8 API backend and Angular 20 frontend. Provides watershed data visualization, time-series analysis, paired regression analysis, and diversion scenario tools. Deployed to Azure Kubernetes Service (AKS) with Helm, using Azure SQL Database and GeoServer for spatial data.

## Tech Stack

| Layer          | Technology                                                    |
|----------------|---------------------------------------------------------------|
| Backend        | .NET 8 / ASP.NET Core Web API / C#                           |
| Frontend       | Angular 20 / TypeScript 5.9 / Node v24 (see `.nvmrc`)        |
| Database       | Azure SQL Server (SQL Server Database Project / DACPAC)       |
| ORM            | Entity Framework Core 8                                       |
| Auth           | Auth0 (JWT Bearer tokens)                                     |
| Maps           | Leaflet + Esri Leaflet + GeoServer (kartoza/geoserver:2.27.1) |
| UI             | PrimeNG 20, ng-bootstrap 19, ag-grid 34, Bootstrap 5         |
| Rich Text      | TinyMCE 8                                                     |
| Charts         | Vega / Vega-Lite                                              |
| Infrastructure | Terraform (Azure), Helm, Docker, Azure DevOps CI/CD          |
| Monitoring     | Datadog synthetic tests, Serilog structured logging           |
| Testing        | MSTest (backend), Jasmine + Karma (frontend)                  |

## Repository Structure

```
Nebula.API/           - ASP.NET Core Web API (controllers, services, config)
Nebula.EFModels/      - Entity Framework Core models & DbContext
Nebula.Models/        - DTOs and helper classes
Nebula.Database/      - SQL Server Database Project (.sqlproj / DACPAC)
Nebula.Tests/         - MSTest backend tests
Nebula.Web/           - Angular 20 frontend SPA
Nebula.GeoServer/     - GeoServer configuration & data directory
Build/                - PowerShell build scripts, scaffolding, CI/CD pipeline
charts/               - Helm chart for AKS deployment
docker-compose/       - Docker Compose for local API development
nebula.tf             - Terraform IaC (Azure resources, Datadog monitors)
```

## Build & Run Commands

### API (Backend)
```bash
# Local dev: Open Nebula.sln in Visual Studio, set docker-compose as startup project, F5
# Or run directly:
dotnet restore
dotnet build
dotnet run --project Nebula.API
```

### Web (Frontend)
```bash
cd Nebula.Web
npm install
npm start              # Dev server at https://nebula.localhost.sitkatech.com:8123
npm run build          # Dev build
npm run build-qa       # QA build (optimized)
npm run build-prod     # Production build (optimized)
npm test               # Jasmine/Karma unit tests
npm run lint           # ESLint
npm run lint-fix       # ESLint with auto-fix
```

### Code Generation
```bash
# Generate TypeScript API client from Swagger spec:
cd Nebula.Web
npm run gen-model      # Reads from ../Nebula.API/swagger.json

# Full database scaffolding (PowerShell):
cd Build
.\Scaffold.ps1         # Regenerates EF models, DTOs, TS enums from database
.\BuildScaffold.ps1    # Build + scaffold
```
The API post-build step generates `swagger.json` automatically on debug builds.

### Database
```powershell
cd Build
.\DatabaseBuild.ps1                # Build DACPAC
.\DatabaseRestore.ps1              # Restore from BACPAC
.\DownloadRestoreBuildScaffold.ps1 # Full refresh: download, restore, build, scaffold
```

### Backend Tests
```bash
dotnet test Nebula.Tests
```

## Code Generation (Important)

**Never manually edit files in `Generated/` directories.** These are auto-generated:

- `Nebula.EFModels/Entities/Generated/` - EF entities from database (via `Scaffold-DbContext`)
- `Nebula.EFModels/Entities/Generated/ExtensionMethods/` - Entity extension methods (via EFCorePOCOGenerator)
- `Nebula.Models/DataTransferObjects/Generated/` - C# DTOs (via EFCorePOCOGenerator)
- `Nebula.Web/src/app/shared/generated/` - TypeScript API client, models, enums (via OpenAPI Generator + EFCorePOCOGenerator)

After database schema changes, run `Build/Scaffold.ps1` to regenerate all generated code.

## Naming Conventions

### C# (Backend)
- **PascalCase** for classes, methods, properties, public members
- Controllers: `{Entity}Controller` extending `SitkaController<T>`
- DTOs: `{Entity}Dto`, `{Entity}UpsertDto`, `{Entity}SimpleDto`
- Namespaces: `Nebula.{Project}.{Feature}`

### TypeScript (Frontend)
- **kebab-case** for file names (`user-list.component.ts`)
- **PascalCase** for classes/interfaces
- **camelCase** for variables, functions, properties
- Components: `{Name}Component` in `pages/` (routed) or `shared/components/` (reusable)
- Services in `services/` or `shared/services/`

### Database
- **PascalCase** for tables (`User`, `CustomPage`, `BackboneSegment`)
- Schema: `dbo`
- Foreign keys: `{Entity}ID`
- Lookup tables for enums (`Role`, `CustomRichTextType`, `FieldDefinitionType`)

## Frontend Architecture

### Key Directories
```
Nebula.Web/src/app/
  pages/              - Route-level components (home, user-list, watershed-detail, etc.)
  services/           - App services (authentication, lyra, alert, utility-functions)
  shared/
    components/       - Reusable UI (header-nav, watershed-map, ag-grid renderers, etc.)
    guards/           - Route guards (disclaimer, custom-page-access, manager-only)
    interceptors/     - HTTP error interceptor
    generated/        - Auto-generated API client (DO NOT EDIT)
      api/            - Service classes
      model/          - TypeScript interfaces
      enum/           - Enums from lookup tables
```

### Auth Pattern
- Auth0 via `@auth0/auth0-angular`
- HTTP interceptor attaches JWT tokens to API requests
- Route guards: `authGuardFn` (Auth0), `ManagerOnlyGuard`, `DataExplorerGuard`, `AcknowledgedDisclaimerGuard`
- Role-based authorization on backend via custom attributes

### Environment Config
- Runtime config loaded from `window.config` via `dynamic-environment.ts`
- Build-time environments: `environment.ts`, `environment.qa.ts`, `environment.prod.ts`

## Backend Architecture

### Key Patterns
- Controllers in `Nebula.API/Controllers/` inherit `SitkaController<T>`
- Business logic in `Nebula.EFModels/Entities/` as extension methods on entities
- Configuration via `NebulaConfiguration` class (loaded from secrets)
- Secrets loaded from `SECRET_PATH` environment variable (Azure Key Vault in prod, `appsecrets.json` locally)
- Spatial data support via NetTopologySuite
- Email via SendGrid

## Infrastructure

### Local Development Setup
1. Create empty `NebulaDB` database in SQL Server
2. Copy `docker-compose/.env.template` to `docker-compose/.env` and fill in values
3. Add hosts entry: `127.0.0.1 nebula.localhost.sitkatech.com`
4. API: Open solution in VS, set docker-compose as startup, run
5. Web: `cd Nebula.Web && npm install && npm start`

### Deployment Pipeline (Azure DevOps)
`Build/azure-pipelines.yml` - Stages: BuildDB -> Test -> BuildWeb (Docker) -> BuildTerraform -> DeployTerraform -> DeployDB (DACPAC) -> DeployGeoServer -> DeployHelm (AKS)

### Key Config Files
- `docker-compose/.env.template` - Local environment variables
- `Nebula.API/appsecrets.json` - Local API secrets (gitignored)
- `nebula.tf` - Terraform (Azure SQL, Key Vault, Storage, Datadog)
- `charts/nebula/values.yaml` - Helm values for AKS deployment
- `Build/build.ini` - Build script configuration

## Git Workflow
- **Main branch**: `develop`
- Feature branches: `features/{feature-name}`
- PRs merge into `develop`
