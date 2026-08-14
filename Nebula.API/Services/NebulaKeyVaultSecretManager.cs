using Azure.Extensions.AspNetCore.Configuration.Secrets;
using Azure.Security.KeyVault.Secrets;

namespace Nebula.API.Services
{
    /// <summary>
    /// Maps Key Vault secret names onto Nebula configuration keys. Vault secret
    /// names allow only letters/digits/dashes, so two translations apply, in
    /// order: the base provider mapping ("Section--Key" -> "Section:Key", the
    /// standard nesting convention), then any remaining single dash becomes an
    /// underscore ("DB-CONNECTION-STRING" -> "DB_CONNECTION_STRING", the
    /// NebulaConfiguration key that a vault name cannot express directly).
    ///
    /// Lives in Nebula.API rather than a shared project because the API is the
    /// only host that reads the vault. wave-runup needs a Common project for
    /// this only because its API, Swagger and Worker hosts all share it.
    /// </summary>
    public class NebulaKeyVaultSecretManager : KeyVaultSecretManager
    {
        public override string GetKey(KeyVaultSecret secret)
        {
            return base.GetKey(secret).Replace("-", "_");
        }
    }
}
