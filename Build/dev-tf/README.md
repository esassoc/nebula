# Nebula dev infrastructure

Terraform for the **dev** support resources that local devcontainers use. This
is a separate, much smaller stack than the deployed qa/prod infrastructure in
the root `nebula.tf`, with its own tfstate key.

## What it creates

| Resource | Why |
|---|---|
| `nebula-dev` resource group | holds the dev vault |
| `nebula-keyvault-dev` (RBAC) | the vault `KeyVaultName` points at in `.devcontainer/.env` |
| `Key Vault Secrets Officer` for the pipeline SP | so the pipeline can seed secrets |
| `Key Vault Secrets User` for the dev AAD group | so a developer's `az login` identity can read them |
| `SendGridApiKey` secret | seeded only when supplied |

## What it deliberately does not create

- **No storage account or blob container.** `NebulaConfiguration` declares no
  `AzureBlobStorageConnectionString` and the API never touches blob storage.
  (wave-runup's equivalent stack does create one, because its app does.)
- **No user-assigned identity.** The devcontainer authenticates as the
  developer via `az login`, so there is no workload for an identity to run as.
- **No `DB-CONNECTION-STRING`.** The devcontainer runs its own SQL Server; the
  connection string comes from `appsecrets.json` through `SECRET_PATH`. Only
  deployed environments read the DB connection string from a vault.

## How secrets reach the app

`Nebula.API/Program.cs` calls `AddAzureKeyVault` only when `KeyVaultName` is
set. `NebulaKeyVaultSecretManager` then maps vault names onto config keys:
`--` becomes `:` (nesting) and a remaining `-` becomes `_`. So a vault secret
named `DB-CONNECTION-STRING` would land on `DB_CONNECTION_STRING`.
`SendGridApiKey` maps 1:1.

Vault secret names may contain only letters, digits and dashes — no
underscores. That restriction is the whole reason the mapping exists.

## Running it

Manual pipeline, `Build/dev-tf/dev-terraform.yml` (`trigger: none`), plan then
approval then apply.

Supply these via an Azure DevOps variable group before the first run — they are
intentionally not in the repo:

- `azureSubscription` — service connection name
- `devReaderGroupObjectId` — AAD group object id for the dev team, or `""` to
  skip the group grant and grant individuals out of band
- `secretSendGridApiKey` — optional; omit and no secret is written

## Prerequisite

The pipeline SP needs **Role Based Access Control Administrator** on
`nebula-keyvault-dev` to create it with `enable_rbac_authorization`. The
narrower *Key Vault Data Access Administrator* cannot set the permission model.
Same prerequisite as the qa/prod vaults in the root stack.
