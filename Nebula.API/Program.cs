using System;
using System.IO;
using Azure.Identity;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Nebula.API.Services;
using Serilog;

namespace Nebula.API
{
    public class Program
    {
        public static void Main(string[] args)
        {
            CreateHostBuilder(args).Build().Run();
        }

        public static IHostBuilder CreateHostBuilder(string[] args)
        {
            var hostBuilder = Host.CreateDefaultBuilder(args)
                .ConfigureAppConfiguration((hostContext, config) =>
                {
                    var configurationRoot = config.Build();
                    var secretPath = configurationRoot["SECRET_PATH"];
                    if (File.Exists(secretPath))
                    {
                        config.AddJsonFile(secretPath);
                    }

                    // Azure Key Vault as the real-secret source in deployed
                    // environments. Opt-in: only wired when KeyVaultName is set,
                    // so local dev with no vault and no `az login` is unaffected
                    // and keeps using the SECRET_PATH file above.
                    // DefaultAzureCredential resolves to the developer's
                    // `az login` identity locally and to the AKS workload
                    // identity in QA/prod.
                    var keyVaultName = configurationRoot["KeyVaultName"];
                    if (!string.IsNullOrWhiteSpace(keyVaultName))
                    {
                        var keyVaultUri = new Uri($"https://{keyVaultName}.vault.azure.net/");
                        config.AddAzureKeyVault(keyVaultUri, new DefaultAzureCredential(),
                            new NebulaKeyVaultSecretManager());
                        // Re-add environment variables after the vault so local
                        // overrides still win over a vault entry.
                        config.AddEnvironmentVariables();
                    }
                })
                .ConfigureLogging(logging => { logging.ClearProviders(); })
                .UseSerilog((context, services, configuration) =>
                {
                    configuration
                        .Enrich.FromLogContext()
                        .ReadFrom.Configuration(context.Configuration);
                }).ConfigureWebHostDefaults(webBuilder => { webBuilder.UseStartup<Startup>(); });
            return hostBuilder;
        }
    }
}
