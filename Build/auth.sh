#!/usr/bin/env bash
# Container auth bootstrap. Run once per host to sign in to:
#   - Azure CLI  (az) — tenant-scoped; used by the database download scripts
#                       and, when KeyVaultName is set, by the app's Key Vault
#                       configuration source.
#   - GitHub CLI (gh, plus the git credential helper via `gh auth setup-git`)
#
# Auth state for claude / az / gh lives in SHARED named volumes
# (nebula-claude-config / nebula-azure-config / nebula-gh-config, see
# .devcontainer/docker-compose.yml), so ONE run seeds every current and future
# devcontainer on this host and survives rebuilds. To force a full sign-out:
#   docker volume rm nebula-claude-config nebula-azure-config nebula-gh-config
#
# Claude Code login is intentionally NOT here — `claude` has no
# non-interactive login subcommand. Run `claude` once and complete the browser
# flow separately.
set -euo pipefail

echo "==> One-time auth bootstrap (az + gh). Two browser flows."
echo "    VS Code forwards the container's OAuth callback ports to your host,"
echo "    so this works from a VS Code devcontainer terminal."
echo ""

# Pass --tenant when AZURE_TENANT_ID is set (in .env / .developer.env). Without
# it, `az login` enumerates every tenant the user can access, which trips
# Conditional-Access policies on unrelated tenants and often hides the intended
# subscription.
az_tenant_args=()
if [ -n "${AZURE_TENANT_ID:-}" ]; then
    az_tenant_args+=(--tenant "$AZURE_TENANT_ID")
fi

if az account show >/dev/null 2>&1; then
    echo "==> az: already signed in as $(az account show --query user.name -o tsv)"
else
    echo "==> az login"
    az login --use-device-code "${az_tenant_args[@]}"
fi

if [ -n "${AZURE_SUBSCRIPTION_ID:-}" ]; then
    echo "==> az: pinning subscription $AZURE_SUBSCRIPTION_ID"
    az account set --subscription "$AZURE_SUBSCRIPTION_ID"
fi

if gh auth status >/dev/null 2>&1; then
    echo "==> gh: already signed in"
else
    echo "==> gh auth login"
    gh auth login
fi
gh auth setup-git

echo ""
echo "==> Done. Key Vault reads now use this az identity via"
echo "    DefaultAzureCredential (KeyVaultName=${KeyVaultName:-<unset>})."
echo "    If you are not in the dev-reader AAD group, either request access or"
echo "    set KeyVaultName= (empty) in .devcontainer/.developer.env to run"
echo "    entirely from appsecrets.json."
