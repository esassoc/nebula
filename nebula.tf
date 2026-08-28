variable "keyVaultName" {
  type = string
}

variable "storageAccountName" {
  type = string
}

variable "resourceGroupName" {
  type = string
}

variable "sqlUsername" {
  type = string
}

variable "sqlPassword" {
  type = string
}

variable "databaseName" {
  type = string
}

variable "dbServerName" {
  type = string
}

variable "databaseEdition" {
  type = string
}

variable "databaseTier" {
  type = string
}

variable "aspNetEnvironment" {
	type = string
}

variable "environment" {
  type = string
}

variable "azureClusterResourceGroup" {
  type = string
}

variable "databaseResourceGroup" {
  type = string
}

variable "datadogApiKey" {
  type = string
  sensitive = true
}

variable "datadogAppKey" {
  type = string
  sensitive = true
}

variable "domainApi" {
  type = string
}

variable "domainWeb" {
  type = string
}

variable "domainGeoserver" {
  type = string
}

variable "elasticPoolName" {
  type = string
}

variable "sqlGeoserverUsername" {
  type = string
}

variable "team" {
  type = string
}

variable "projectNumber" {
  type = string
}

// this variable is used for the keepers for the random resources https://registry.terraform.io/providers/hashicorp/random/latest/docs
variable "amd_id" {
  type = string
  sensitive = false
  default = "1"
}

# --- workload identity + Key Vault runtime config ---------------------------

# AKS cluster OIDC issuer URL (spoke KV secret kv-clusterOidcIssuerUrl) -- the
# issuer for the federated workload-identity credentials.
variable "clusterOidcIssuerUrl" {
  type = string
}

# K8s namespace the Nebula ServiceAccounts live in (helm deploys to $(team)).
variable "aksNamespace" {
  type    = string
  default = "h2o"
}

# Runtime app secret seeded into the vault (only when non-empty).
variable "sendGridApiKey" {
  type      = string
  sensitive = true
  default   = ""
}

# H2O Entra group object IDs (identifiers, not secrets) for Key Vault read
# access via `az login` + DefaultAzureCredential. Empty string skips the grant.
# Same trio wave-runup uses -- nebula is the same team, so the same groups.
variable "h2oQaGroupObjectId" {
  type    = string
  default = "c17266ef-57de-4cb9-b505-80a1eeccec60"
}

variable "h2oProdGroupObjectId" {
  type    = string
  default = "63de4f43-d4c8-4ba6-8718-a8a20a06f7cd"
}

variable "h2oReadersGroupObjectId" {
  type    = string
  default = "5136cec4-2c3d-41c5-b938-1a8053938118"
}

terraform {
  # Was ">= 0.11", which this file has not actually supported for years: the
  # required_providers block form needs >= 0.13 and the federated-credential
  # for_each needs >= 0.12. The pipeline installs 1.9.1
  # (TerraformVersion default in terraform.yml@BuildTemplates), so this floor
  # is well below what actually runs -- it just stops the declared minimum
  # from being misleading. Matches Build/dev-tf/Main.tf.
  required_version   = ">= 1.1"
  backend "azurerm" {
    container_name          = "terraform"
    key                     = "terraform.tfstate"
  } 
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "=3.91.0"
    }
    random = {
      source = "hashicorp/random"
      version = "~> 3.2.0"
    }
    time = {
      source  = "hashicorp/time"
      version = "~> 0.9"
    }
	 datadog = {
      source = "DataDog/datadog"
    }
  }
}

# Configure the Azure Provider
provider "azurerm" {
  features {}
}

# Configure the Datadog provider
provider "datadog" {
  api_key = var.datadogApiKey
  app_key = var.datadogAppKey
}

data "azurerm_client_config" "current" {}


locals {
  tags = {
    "managed"     = "terraformed"
    "environment" = var.environment
    "team" = var.team
    "projectNumber" = var.projectNumber
  }
}


resource "azurerm_resource_group" "web" {
  name                         = var.resourceGroupName
  location                     = "West US"
  tags                         = local.tags
}


#blob storage
resource "azurerm_storage_account" "web" {
  name                         = var.storageAccountName
  resource_group_name          = azurerm_resource_group.web.name
  location                     = azurerm_resource_group.web.location
  account_replication_type     = "GRS"
  account_tier                 = "Standard"
  tags                         = local.tags
}

output "application_storage_account_key" {
  sensitive = true
  value = azurerm_storage_account.web.primary_access_key
}

# the SAS token which is needed for the geoserver file transfer
data "azurerm_storage_account_sas" "web" {
  connection_string = azurerm_storage_account.web.primary_connection_string
  https_only        = true

  resource_types {
    service   = true
    container = true
    object    = true
  }

  services {
    blob  = true
    queue = false
    table = false
    file  = true
  }

  start  = timestamp()
  expiry = timeadd(timestamp(), "24h")

  permissions {
    read    = true
    write   = true
    delete  = true
    list    = true
    add     = true
    create  = true
    update  = true
    process = true
    tag     = false
    filter  = false
  }
}

# can be used in pipeline like $(TF_OUT_STORAGE_ACCOUNT_SAS_KEY)
output "storage_account_sas_key" {
  sensitive = true
  value = data.azurerm_storage_account_sas.web.sas
}

resource "azurerm_storage_share" "web" {
  name                 = "geoserver"
  storage_account_name = azurerm_storage_account.web.name
  quota                = 10 //10gb
}

#sql
data "azurerm_mssql_server" "spoke" {
  name                = var.dbServerName
  resource_group_name = var.databaseResourceGroup
}

data "azurerm_mssql_elasticpool" "spoke" {
  name                = var.elasticPoolName
  resource_group_name = var.databaseResourceGroup
  server_name         = var.dbServerName
}

resource "azurerm_mssql_database" "database" {
  name            = var.databaseName
  server_id       = data.azurerm_mssql_server.spoke.id
  collation       = "SQL_Latin1_General_CP1_CI_AS"
  license_type    = "LicenseIncluded"
  max_size_gb     = 2
  read_scale      = false
  sku_name        = var.databaseTier
  zone_redundant  = false
  elastic_pool_id = data.azurerm_mssql_elasticpool.spoke.id
  enclave_type = "VBS"

  long_term_retention_policy {
    weekly_retention  = "P3M"
    monthly_retention = "P1Y"
    yearly_retention  = "P3Y"
    week_of_year      = 7
  }

  short_term_retention_policy {
    retention_days = 30
  }

  tags            = local.tags
}

output "database_id" {
  value = azurerm_mssql_database.database.id
}

### API Sql user/login: RETIRED ###
# The API authenticates to SQL as the workload identity
# (Authentication=Active Directory Default -- see the DB-CONNECTION-STRING
# secret below), so the NebulaWeb SQL login, its generated password and the
# sqlApiUsername/sqlApiPassword/sqlApiConnectionString vault secrets are gone.
# GeoServer's SQL login is deliberately unaffected: its JDBC store has no
# Entra path and keeps the credentials defined further down.


### BEGIN Geoserver Sql user/login ###
resource "random_password" "geoserverAdminPassword" {
  length           = 16
  special          = true
  override_special = "!+-"
  min_lower        = 3
  min_upper        = 3
  min_special      = 3
  min_numeric      = 3
  keepers = {
    amd_id = var.amd_id
  }
}

output "geoserver_admin_password" {
  sensitive = true
  value = random_password.geoserverAdminPassword.result
  depends_on = [
    random_password.geoserverAdminPassword
  ]
}


resource "random_password" "sqlGeoserverPassword" {
  length           = 16
  special          = true
  override_special = "!*-_"
  min_special      = 1
  min_lower        = 1
  min_upper        = 1
  min_numeric      = 1
  keepers = {
    amd_id = var.amd_id
  }
}

output "sql_geoserver_password" {
  sensitive = true
  value = random_password.sqlGeoserverPassword.result
  depends_on = [
    random_password.sqlGeoserverPassword
  ]
}

### END Geoserver Sql user/login ###

#key vault was created prior to terraform run
resource "azurerm_key_vault" "web" {
  name                         = var.keyVaultName
  location                     = azurerm_resource_group.web.location

  resource_group_name          = azurerm_resource_group.web.name
  soft_delete_retention_days   = 7
  purge_protection_enabled     = false
  tenant_id                    = data.azurerm_client_config.current.tenant_id
  tags                         = local.tags

  # RBAC authorization -- data-plane access now comes from role assignments
  # (the pipeline SP's Secrets Officer grant, the workload identity, and the
  # H2O groups; see the workload-identity section below) rather than the
  # access policy that used to live here.
  #
  # PREREQ (manual, out-of-band): the pipeline SP must hold "Role Based Access
  # Control Administrator" on this vault. The narrower "Key Vault Data Access
  # Administrator" cannot flip the permission model -- that change needs an
  # unconditioned roleAssignments/write grant.
  enable_rbac_authorization = true

  sku_name = "standard"
}

# The pipeline SP writes/seeds secrets via RBAC once the vault flips.
resource "azurerm_role_assignment" "pipeline_kv_secrets_officer" {
  scope                = azurerm_key_vault.web.id
  role_definition_name = "Key Vault Secrets Officer"
  principal_id         = data.azurerm_client_config.current.object_id
}

# RBAC role assignments take seconds-to-minutes to propagate; secret writes in
# the same apply 403 without this buffer. Worst case the apply is re-runnable.
resource "time_sleep" "kv_rbac_propagation" {
  depends_on      = [azurerm_role_assignment.pipeline_kv_secrets_officer]
  create_duration = "120s"
}

resource "azurerm_key_vault_secret" "sqlAdminPass" {
  name                         = "sqlAdministratorPassword"
  value                        = var.sqlPassword
  key_vault_id                 = azurerm_key_vault.web.id

  tags                         = local.tags
  depends_on = [
    time_sleep.kv_rbac_propagation
  ]
}
 
resource "azurerm_key_vault_secret" "sqlAdminUser" {
  name                         = "sqlAdministratorUsername"
  value                        = var.sqlUsername
  key_vault_id                 = azurerm_key_vault.web.id

  tags                         = local.tags
  depends_on = [
    time_sleep.kv_rbac_propagation
  ]
}

resource "azurerm_key_vault_secret" "sqlGeoserverUsername" {
  name                         = "sqlGeoserverUsername"
  value                        = var.sqlGeoserverUsername
  key_vault_id                 = azurerm_key_vault.web.id

  tags                         = local.tags
  depends_on = [
    time_sleep.kv_rbac_propagation
  ]
}

resource "azurerm_key_vault_secret" "sqlGeoserverPassword" {
  name                         = "sqlGeoserverPassword"
  value                        = random_password.sqlGeoserverPassword.result
  key_vault_id                 = azurerm_key_vault.web.id

  tags                         = local.tags
  depends_on = [
    time_sleep.kv_rbac_propagation
  ]
}

resource "azurerm_key_vault_secret" "sqlGeoserverConnectionString" {
  name                         = "sqlGeoserverConnectionString"
  value                        = "Data Source=tcp:${data.azurerm_mssql_server.spoke.fully_qualified_domain_name},1433;Initial Catalog=${var.databaseName};Persist Security Info=True;User ID=${var.sqlGeoserverUsername};Password=${random_password.sqlGeoserverPassword.result}"
  key_vault_id                 = azurerm_key_vault.web.id

  tags                         = local.tags
  depends_on = [
    time_sleep.kv_rbac_propagation
  ]
}

resource "azurerm_key_vault_secret" "geoserverAdminPassword" {
  name                         = "geoserverAdminPassword"
  value                        = random_password.geoserverAdminPassword.result
  key_vault_id                 = azurerm_key_vault.web.id

  tags                         = local.tags
  depends_on = [
    time_sleep.kv_rbac_propagation
  ]
}

# =============================================================================
# Workload identity + Key Vault runtime config
# =============================================================================
# The API pod carries no secrets: it authenticates as the user-assigned
# identity below (federated to its K8s ServiceAccount via the cluster OIDC
# issuer) and reads config from this env's Key Vault at startup
# (KeyVaultName -> AddAzureKeyVault(DefaultAzureCredential) in
# Nebula.API/Program.cs). Its SQL auth is
# 'Authentication=Active Directory Default' -- no username or password.
#
# GeoServer is deliberately NOT included: its JDBC datastore has no Entra
# path, so it keeps a SQL login whose password stays in this vault and passes
# through Helm.

resource "azurerm_user_assigned_identity" "nebula" {
  # var.environment is already lowercase (the storage-account name derives
  # from it), so no lower() needed -- but the pipeline's db-aad-user step must
  # reference the exact same casing.
  name                = "nebula-${var.environment}-identity"
  location            = azurerm_resource_group.web.location
  resource_group_name = azurerm_resource_group.web.name
  tags                = local.tags
}

locals {
  # ServiceAccount names = helm fullname = "<release>-<chart>". The release is
  # 'nebula' and the subchart Chart.yaml names are the BARE words api/web/
  # geoserver (the nebula-* directory names are just folders), so fullnames are
  # nebula-api etc. Renaming a subchart's Chart.yaml name would change its
  # ServiceAccount name and break the federation below.
  #
  # Only the API federates. Web is static nginx and makes no Azure calls;
  # GeoServer reaches Azure only through the Azure File CSI driver, which uses
  # a storage-account key rather than a token.
  workload_identity_subjects = [
    "nebula-api",
  ]

  is_prod = var.environment == "prod"
}

resource "azurerm_federated_identity_credential" "nebula" {
  for_each            = toset(local.workload_identity_subjects)
  name                = each.value
  resource_group_name = azurerm_resource_group.web.name
  audience            = ["api://AzureADTokenExchange"]
  issuer              = var.clusterOidcIssuerUrl
  parent_id           = azurerm_user_assigned_identity.nebula.id
  subject             = "system:serviceaccount:${var.aksNamespace}:${each.value}"
}

# The workload identity reads secrets at pod startup.
resource "azurerm_role_assignment" "identity_kv_secrets_user" {
  scope                = azurerm_key_vault.web.id
  role_definition_name = "Key Vault Secrets User"
  principal_id         = azurerm_user_assigned_identity.nebula.principal_id
}

# --- H2O group access matrix -------------------------------------------------
# The environment is the boundary:
#
#   H2O Prod     works in QA and prod    -- read and write
#   H2O QA       works in QA and dev     -- read and write, NO prod access
#   H2O Readers  reads QA                -- no prod access
#
# The same matrix governs database access, granted as contained users by the
# 'Grant DB access to H2O Entra groups' step in Build/azure-pipelines.yml. Change
# both together or the boundary is fiction: an earlier pass removed the prod vault
# grant and left the prod database grant behind, which is worse than either
# consistent state.
#
# H2O Prod is nested inside H2O QA, and Azure RBAC resolves membership
# transitively, so prod staff reach the non-prod grants through the nesting even
# without a grant of their own. The H2O Prod grants below on the non-prod
# environments are therefore redundant, and kept deliberately: if the groups are
# ever un-nested, prod staff keep QA access instead of silently losing it. The
# nesting does not weaken the boundary -- it runs prod-into-QA, so somebody in
# H2O QA alone still gets nothing on prod.
#
# Each grant needs BOTH halves to be useful, which is the usual Azure trip-up:
# Reader at resource-group scope makes the resources visible in the portal but
# grants no blob access whatsoever, and the Storage Blob Data roles grant blob
# access but do not make the account visible. Neither implies the other, and
# Contributor on a storage account still cannot read a blob over Entra auth.
#
# Guarded on a non-empty object id so a group that does not exist yet can be
# skipped by clearing its variable.
#
# PREREQUISITE: the prod group must be NESTED INSIDE the qa group. Its grants below
# are prod-only, so prod staff reach QA and dev through the qa group's grants and
# Azure RBAC's transitive membership resolution -- not through a grant of their own.
# The pipeline's database matrix relies on the same nesting. Un-nesting the groups
# therefore removes prod staff's non-prod access, in Azure and in SQL, with no code
# change to warn anybody: re-add the non-prod grants at the same time.

# --- Key Vault ---
resource "azurerm_role_assignment" "h2o_prod_group_kv_secrets_officer" {
  count                = var.h2oProdGroupObjectId != "" && local.is_prod ? 1 : 0
  scope                = azurerm_key_vault.web.id
  role_definition_name = "Key Vault Secrets Officer"
  principal_id         = var.h2oProdGroupObjectId
}

resource "azurerm_role_assignment" "h2o_qa_group_kv_secrets_officer" {
  count                = var.h2oQaGroupObjectId != "" && !local.is_prod ? 1 : 0
  scope                = azurerm_key_vault.web.id
  role_definition_name = "Key Vault Secrets Officer"
  principal_id         = var.h2oQaGroupObjectId
}

resource "azurerm_role_assignment" "h2o_readers_group_kv_secrets_user" {
  count                = var.h2oReadersGroupObjectId != "" && !local.is_prod ? 1 : 0
  scope                = azurerm_key_vault.web.id
  role_definition_name = "Key Vault Secrets User"
  principal_id         = var.h2oReadersGroupObjectId
}

# --- Resource group: makes the environment's resources visible at all ---
# Reader here is management-plane only: it makes the resources visible and grants
# no blob access at all. The Storage Blob Data roles below are the other half, and
# neither implies the other -- Contributor on a storage account still cannot read
# a blob over Entra auth.
resource "azurerm_role_assignment" "h2o_prod_group_rg_reader" {
  count                = var.h2oProdGroupObjectId != "" && local.is_prod ? 1 : 0
  scope                = azurerm_resource_group.web.id
  role_definition_name = "Reader"
  principal_id         = var.h2oProdGroupObjectId
}

resource "azurerm_role_assignment" "h2o_qa_group_rg_reader" {
  count                = var.h2oQaGroupObjectId != "" && !local.is_prod ? 1 : 0
  scope                = azurerm_resource_group.web.id
  role_definition_name = "Reader"
  principal_id         = var.h2oQaGroupObjectId
}

resource "azurerm_role_assignment" "h2o_readers_group_rg_reader" {
  count                = var.h2oReadersGroupObjectId != "" && !local.is_prod ? 1 : 0
  scope                = azurerm_resource_group.web.id
  role_definition_name = "Reader"
  principal_id         = var.h2oReadersGroupObjectId
}

# --- Storage blobs: the data plane ---
# Scoped to the application storage account. The count-conditional "dev" account
# some of these stacks declare is deliberately left alone: it is the throwaway
# mirror restore-dev-blob.yml populates rather than application data, and it
# exists only when storageAccountDevApplicationName is set.
resource "azurerm_role_assignment" "h2o_prod_group_blob_contributor" {
  count                = var.h2oProdGroupObjectId != "" && local.is_prod ? 1 : 0
  scope                = azurerm_storage_account.web.id
  role_definition_name = "Storage Blob Data Contributor"
  principal_id         = var.h2oProdGroupObjectId
}

resource "azurerm_role_assignment" "h2o_qa_group_blob_contributor" {
  count                = var.h2oQaGroupObjectId != "" && !local.is_prod ? 1 : 0
  scope                = azurerm_storage_account.web.id
  role_definition_name = "Storage Blob Data Contributor"
  principal_id         = var.h2oQaGroupObjectId
}

resource "azurerm_role_assignment" "h2o_readers_group_blob_reader" {
  count                = var.h2oReadersGroupObjectId != "" && !local.is_prod ? 1 : 0
  scope                = azurerm_storage_account.web.id
  role_definition_name = "Storage Blob Data Reader"
  principal_id         = var.h2oReadersGroupObjectId
}

# --- Runtime app secrets ----------------------------------------------------
# Names map onto config keys via NebulaKeyVaultSecretManager: '--' -> ':' and
# '-' -> '_', so DB-CONNECTION-STRING lands on DB_CONNECTION_STRING (KV names
# cannot contain underscores). The other names map 1:1.
resource "azurerm_key_vault_secret" "appDbConnectionString" {
  name         = "DB-CONNECTION-STRING"
  # AAD-based auth. The pod authenticates via DefaultAzureCredential (workload
  # identity -> azurerm_user_assigned_identity.nebula above). The DB user for
  # that identity is created by the pipeline's db-aad-user step after every
  # DacPac deploy (CREATE USER FROM EXTERNAL PROVIDER); the SQL server's Entra
  # admin must be set first.
  value        = "Server=tcp:${data.azurerm_mssql_server.spoke.fully_qualified_domain_name},1433;Database=${var.databaseName};Authentication=Active Directory Default;Encrypt=True;"
  key_vault_id = azurerm_key_vault.web.id
  tags         = local.tags
  depends_on   = [time_sleep.kv_rbac_propagation]
}

# Only seed when a value was supplied (avoids writing empty secrets).
resource "azurerm_key_vault_secret" "appSendGridApiKey" {
  count        = var.sendGridApiKey != "" ? 1 : 0
  name         = "SendGridApiKey"
  value        = var.sendGridApiKey
  key_vault_id = azurerm_key_vault.web.id
  tags         = local.tags
  depends_on   = [time_sleep.kv_rbac_propagation]
}

output "workload_identity_client_id" {
  value = azurerm_user_assigned_identity.nebula.client_id
}

output "workload_identity_tenant_id" {
  value = azurerm_user_assigned_identity.nebula.tenant_id
}

resource "datadog_synthetics_test" "api_test" {
  type    = "api"
  subtype = "http"
  request_definition {
    method = "GET"
    url    = "https://${var.domainApi}/healthz"
  }
  request_headers = {
    Content-Type   = "application/json"
  }
  assertion {
    type     = "statusCode"
    operator = "is"
    target   = "200"
  }
  locations = ["aws:us-west-1","aws:us-east-1"]
  options_list {
    tick_every = 900

    retry {
      count    = 2
      interval = 30000
    }

    monitor_options {
      renotify_interval = 120
    }
  }
  name    = "${var.environment} - https://${var.domainApi} API test"
  message = "Notify @rlee@esassoc.com @sgordon@esassoc.com @team-${var.team}${var.environment == "qa" ? "-qa" : ""}"
  tags    = ["env:${var.environment}", "managed:terraformed", "team:${var.team}"]

  status = "live"
}

resource "datadog_synthetics_test" "web_test" {
  type    = "api"
  subtype = "http"
  request_definition {
    method = "GET"
    url    = "https://${var.domainWeb}"
  }
  request_headers = {
    Content-Type   = "application/json"
  }
  assertion {
    type     = "statusCode"
    operator = "is"
    target   = "200"
  }
  locations = ["aws:us-west-1","aws:us-east-1"]
  options_list {
    tick_every = 900

    retry {
      count    = 2
      interval = 30000
    }

    monitor_options {
      renotify_interval = 120
    }
  }
  name    = "${var.environment} - https://${var.domainWeb} Web test"
  message = "Notify @rlee@esassoc.com @sgordon@esassoc.com @team-${var.team}${var.environment == "qa" ? "-qa" : ""}"
  tags    = ["env:${var.environment}", "managed:terraformed", "team:${var.team}"]

  status = "live"
}

resource "datadog_synthetics_test" "geoserver_test" {
  type    = "api"
  subtype = "http"
  request_definition {
    method = "GET"
    url    = "https://${var.domainGeoserver}/geoserver/web/wicket/resource/org.geoserver.web.GeoServerBasePage/img/logo.png"
  }
  request_headers = {
    Content-Type   = "application/json"
  }
  assertion {
    type     = "statusCode"
    operator = "is"
    target   = "200"
  }
  locations = ["aws:us-west-1","aws:us-east-1"]
  options_list {
    tick_every = 900

    retry {
      count    = 2
      interval = 30000
    }

    monitor_options {
      renotify_interval = 120
    }
  }
  name    = "${var.environment} - https://${var.domainGeoserver} Geoserver test"
  message = "Notify @rlee@esassoc.com @sgordon@esassoc.com @team-${var.team}${var.environment == "qa" ? "-qa" : ""}"
  tags    = ["env:${var.environment}", "managed:terraformed", "team:${var.team}"]

  status = "live"
}