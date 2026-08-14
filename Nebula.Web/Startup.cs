using System;
using System.IO;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Rewrite;
using Microsoft.AspNetCore.StaticFiles;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Hosting;
using Microsoft.Net.Http.Headers;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Nebula.Web
{
    public class Startup
    {
        private readonly IWebHostEnvironment _environment;
        public IConfiguration Configuration { get; set; }

        public Startup(IWebHostEnvironment environment)
        {
            var currentDirectory = Directory.GetCurrentDirectory();
            var builder = new ConfigurationBuilder()
                .SetBasePath(currentDirectory)
                .AddEnvironmentVariables();

            Configuration = builder.Build();

            _environment = environment;
        }

        // This method gets called by the runtime. Use this method to add services to the container.
        // For more information on how to configure your application, visit https://go.microsoft.com/fwlink/?LinkID=398940
        public void ConfigureServices(IServiceCollection services)
        {
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IWebHostEnvironment env, ILoggerFactory loggerFactory, IHostApplicationLifetime applicationLifetime)
        {
            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
                var options = new RewriteOptions().AddRedirectToHttps(301, 9001);
                app.UseRewriter(options);
            }
            
            app.Use(async (context, next) =>
            {
                if (context.Request.Host.Host.Contains("swn.yachats.sitkatech.com", StringComparison.OrdinalIgnoreCase))
                {
                    // Redirect to the www domain
                    var wwwUri = new UriBuilder
                    {
                        Scheme = context.Request.Scheme,
                        Host = "www.smartwatershednetwork.org",
                        Path = context.Request.Path,
                        Query = context.Request.QueryString.ToString()
                    };
                    context.Response.Redirect(wwwUri.Uri.ToString(), permanent: true);
                    return;
                }
                if (context.Request.Path.Value == "/assets/config.json")
                {
                    var result = new ConfigDto(Configuration);
                    var json = JsonSerializer.Serialize(result);
                    await context.Response.WriteAsync(json);
                    return;
                }

                await next();

                if (context.Response.StatusCode == 404 && !Path.HasExtension(context.Request.Path.Value))
                {
                    context.Request.Path = "/index.html";
                    context.Response.StatusCode = 200;
                    await next();
                }
            });

            app.UseDefaultFiles();
            app.UseStaticFiles(new StaticFileOptions { OnPrepareResponse = SetSpaCacheHeaders });
        }

        // Hashed Angular bundles can be cached forever because their URLs change every build.
        // Stable URLs, especially index.html, must revalidate so the browser does not keep
        // a stale SPA shell that points at deleted bundle filenames.
        // First alternative `-[A-Z0-9]{8,}` matches esbuild's `name-HASH.ext` (uppercase base32).
        // Second alternative `\.[a-f0-9]{16,}` matches classic webpack's `name.HASH.ext` (lowercase
        // hex, default 16 chars). Both alternatives are narrow enough to avoid false-positives on
        // ordinary lowercase asset names (e.g., `account-activity-screenshot.png`).
        private static readonly Regex HashedAssetPattern = new(@"(?:-[A-Z0-9]{8,}|\.[a-f0-9]{16,})\.[a-z0-9]+$", RegexOptions.Compiled);

        private static void SetSpaCacheHeaders(StaticFileResponseContext context)
        {
            var headers = context.Context.Response.GetTypedHeaders();
            var fileName = Path.GetFileName(context.File.Name);
            if (HashedAssetPattern.IsMatch(fileName))
            {
                headers.CacheControl = new CacheControlHeaderValue
                {
                    Public = true,
                    MaxAge = TimeSpan.FromDays(365),
                    Extensions = { new NameValueHeaderValue("immutable") }
                };
            }
            else
            {
                headers.CacheControl = new CacheControlHeaderValue { NoCache = true };
            }
        }
    }

    public class ConfigDto
    {
        public ConfigDto(IConfiguration configuration)
        {
            Production = bool.Parse(configuration["Production"]);
            Staging = bool.Parse(configuration["Staging"]);
            Dev = bool.Parse(configuration["Dev"]);
            MainAppApiUrl = configuration["MainAppApiUrl"];
            GeoserverMapServiceUrl = configuration["GeoserverMapServiceUrl"];
            Auth0Configuration = new Auth0ConfigurationDto(configuration);
            LyraBaseURL = configuration["LyraBaseURL"];
        }

        [JsonPropertyName("production")]
        public bool Production { get; set; }
        [JsonPropertyName("staging")]
        public bool Staging { get; set; }
        [JsonPropertyName("dev")]
        public bool Dev { get; set; }
        [JsonPropertyName("mainAppApiUrl")]
        public string MainAppApiUrl { get; set; }
        [JsonPropertyName("geoserverMapServiceUrl")]
        public string GeoserverMapServiceUrl { get; set; }
        [JsonPropertyName("auth0Configuration")]
        public Auth0ConfigurationDto Auth0Configuration { get; set; }
        [JsonPropertyName("lyraBaseURL")]
        public string LyraBaseURL {get; set;}
    }

    public class Auth0ConfigurationDto
    {
        public Auth0ConfigurationDto(IConfiguration configuration)
        {
            Domain = configuration["Auth0_Domain"];
            ClientID = configuration["Auth0_ClientID"];
            Audience = configuration["Auth0_Audience"];
        }

        [JsonPropertyName("domain")]
        public string Domain { get; set; }
        [JsonPropertyName("clientId")]
        public string ClientID { get; set; }
        [JsonPropertyName("audience")]
        public string Audience { get; set; }
    }
}
