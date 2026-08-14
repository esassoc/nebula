# =============================================================================
# Nebula dev-environment infrastructure (Terraform)
# =============================================================================
# Stands up the DEV support resources local devcontainers use -- principally
# the dev Key Vault the API reads at runtime when `KeyVaultName` is set (see
# .devcontainer/.env and Nebula.API/Program.cs AddAzureKeyVault). This is a
# SEPARATE, lighter stack from the deployed qa/prod infra in the root
# nebula.tf.
#
# Auth model: RBAC (enable_rbac_authorization). A developer's `az login`
# identity reads secrets via DefaultAzureCredential once their AAD group holds
# "Key Vault Secrets User" (var.devReaderGroupObjectId below).
#
# Deliberately smaller than wave-runup's equivalent:
#   - No dev storage account or blob container. NebulaConfiguration declares no
#     AzureBlobStorageConnectionString and the API never touches blob storage;
#     the only storage in this app is GeoServer's Azure File share, which is a
#     deployed-environment concern, not a dev one.
#   - No dev user-assigned identity. wave-runup needs one so its dev workloads
#     can reach blob storage; nebula's devcontainer authenticates as the
#     developer, so there is nothing for an identity to do.
# =============================================================================

variable "keyVaultName" {
  type        = string
  description = "Dev Key Vault name, e.g. nebula-keyvault-dev. Must be globally unique."
}

variable "resourceGroupName" {
  type        = string
  description = "Dev resource group for the vault, e.g. nebula-dev."
}

variable "team" {
  type = string
}

variable "projectNumber" {
  type = string
}

# AAD security group whose members (the dev team) get read access to the dev
# vault via `az login` + DefaultAzureCredential. Set the group's object id in
# the pipeline. Leave "" to skip the group grant (individual devs can be
# granted Key Vault Secrets User out of band).
variable "devReaderGroupObjectId" {
  type    = string
  default = ""
}

# --- Seeded secrets ----------------------------------------------------------
# Key Vault secret NAMES allow only letters/digits/dashes (NO underscores). The
# Azure config provider maps `--` -> `:` for nesting, and
# NebulaKeyVaultSecretManager then maps a remaining `-` -> `_`. SendGridApiKey
# maps 1:1.
#
# DB-CONNECTION-STRING is intentionally NOT seeded here: the devcontainer runs
# its own SQL Server, so the connection string comes from appsecrets.json via
# SECRET_PATH rather than from the vault.
variable "secretSendGridApiKey" {
  type      = string
  sensitive = true
  default   = ""
}

terraform {
  # azurerm 3.x + required_providers syntax need modern Terraform; the pipeline
  # template installs 1.9.1 (see terraform.yml@BuildTemplates).
  required_version = ">= 1.1"
  backend "azurerm" {
    container_name = "terraform"
    # DISTINCT key from the root nebula.tf state ("terraform.tfstate") so this
    # dev stack can never clobber the deployed-infra state even if they share a
    # storage account/container. Account/container in dev-terraform.yml.
    key = "dev-terraform.tfstate"
  }
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "=3.91.0"
    }
    time = {
      source  = "hashicorp/time"
      version = "~> 0.9"
    }
  }
}

provider "azurerm" {
  features {}
}

data "azurerm_client_config" "current" {}

locals {
  tags = {
    "managed"       = "terraformed"
    "environment"   = "dev"
    "team"          = var.team
    "projectNumber" = var.projectNumber
  }
}

resource "azurerm_resource_group" "dev" {
  name     = var.resourceGroupName
  location = "West US"
  tags     = local.tags
}

# --- Dev Key Vault (RBAC) ----------------------------------------------------
resource "azurerm_key_vault" "dev" {
  name                       = var.keyVaultName
  location                   = azurerm_resource_group.dev.location
  resource_group_name        = azurerm_resource_group.dev.name
  tenant_id                  = data.azurerm_client_config.current.tenant_id
  sku_name                   = "standard"
  soft_delete_retention_days = 7
  purge_protection_enabled   = false
  enable_rbac_authorization  = true
  tags                       = local.tags
}

# The pipeline SP seeds secrets into the vault.
resource "azurerm_role_assignment" "pipeline_secrets_officer" {
  scope                = azurerm_key_vault.dev.id
  role_definition_name = "Key Vault Secrets Officer"
  principal_id         = data.azurerm_client_config.current.object_id
}

# RBAC assignments take seconds-to-minutes to propagate; secret writes in the
# same apply 403 without this buffer.
resource "time_sleep" "kv_rbac_propagation" {
  depends_on      = [azurerm_role_assignment.pipeline_secrets_officer]
  create_duration = "120s"
}

# Developers read the dev vault with their own `az login` identity.
resource "azurerm_role_assignment" "dev_group_secrets_user" {
  count                = var.devReaderGroupObjectId != "" ? 1 : 0
  scope                = azurerm_key_vault.dev.id
  role_definition_name = "Key Vault Secrets User"
  principal_id         = var.devReaderGroupObjectId
}

# --- Seeded secrets ----------------------------------------------------------
resource "azurerm_key_vault_secret" "sendGridApiKey" {
  count        = var.secretSendGridApiKey != "" ? 1 : 0
  name         = "SendGridApiKey"
  value        = var.secretSendGridApiKey
  key_vault_id = azurerm_key_vault.dev.id
  tags         = local.tags
  depends_on   = [time_sleep.kv_rbac_propagation]
}

output "key_vault_name" {
  value = azurerm_key_vault.dev.name
}
