using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.ResponseCompression;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Nebula.API.Converters;
using Nebula.API.Logging;
using Nebula.API.Services;
using Nebula.EFModels.Entities;
using NetTopologySuite.IO.Converters;
using SendGrid;
using Serilog;
using System;
using System.IO.Compression;
using System.Linq;
using System.Text.Json.Serialization;
using ILogger = Serilog.ILogger;

namespace Nebula.API
{
    public class Startup
    {
        private readonly IWebHostEnvironment _environment;

        public Startup(IWebHostEnvironment environment, IConfiguration configuration)
        {
            Configuration = configuration;
            _environment = environment;
        }

        public IConfiguration Configuration { get; }

        // This method gets called by the runtime. Use this method to add services to the container.
        public void ConfigureServices(IServiceCollection services)
        {
            services.AddControllers().AddJsonOptions(opt =>
            {
                opt.JsonSerializerOptions.Converters.Add(new GeoJsonConverterFactory());
                opt.JsonSerializerOptions.Converters.Add(new DateTimeConverter());
                opt.JsonSerializerOptions.Converters.Add(new BooleanConverter());
                opt.JsonSerializerOptions.Converters.Add(new DoubleConverter(2));
                opt.JsonSerializerOptions.Converters.Add(new IntConverter());
                opt.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
                opt.JsonSerializerOptions.Converters.Add(new NullableConverterFactory());
                opt.JsonSerializerOptions.PropertyNameCaseInsensitive = false;
                opt.JsonSerializerOptions.PropertyNamingPolicy = null;
                opt.JsonSerializerOptions.NumberHandling = JsonNumberHandling.AllowNamedFloatingPointLiterals;
                opt.JsonSerializerOptions.WriteIndented = true;
            });

            services.AddResponseCompression(options =>
            {
                options.EnableForHttps = true;
                options.Providers.Add<BrotliCompressionProvider>();
                options.Providers.Add<GzipCompressionProvider>();
                options.MimeTypes = ResponseCompressionDefaults.MimeTypes.Concat(new[] { "application/json" });
            });
            services.Configure<BrotliCompressionProviderOptions>(options => options.Level = CompressionLevel.Optimal);
            services.Configure<GzipCompressionProviderOptions>(options => options.Level = CompressionLevel.Optimal);

            services.Configure<NebulaConfiguration>(Configuration);

            var nebulaConfiguration = Configuration.Get<NebulaConfiguration>();

            services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            }).AddJwtBearer(options =>
            {
                options.Authority = Configuration["AUTH0_AUTHORITY"];
                options.Audience = Configuration["AUTH0_AUDIENCE"];
            });

            services.AddDbContext<NebulaDbContext>(c =>
            {
                c.UseSqlServer(nebulaConfiguration.DB_CONNECTION_STRING, x =>
                {
                    x.CommandTimeout((int)TimeSpan.FromMinutes(3).TotalSeconds);
                    x.UseNetTopologySuite();
                });
            });

            services.AddSingleton(Configuration);
            services.AddSingleton<IHttpContextAccessor, HttpContextAccessor>();

            services.AddSingleton<ISendGridClient>(_ => new SendGridClient(nebulaConfiguration.SendGridApiKey));
            services.AddSingleton<SitkaSmtpClientService>();

            services.AddScoped(s => s.GetService<IHttpContextAccessor>().HttpContext);
            services.AddScoped(s => UserContext.GetUserFromHttpContext(s.GetService<NebulaDbContext>(),
                s.GetService<IHttpContextAccessor>().HttpContext));
            services.AddControllers();

            #region Swagger
            // Base swagger services
            services.AddSwaggerGen(options =>
            {
            });
            #endregion

            services.AddHealthChecks().AddDbContextCheck<NebulaDbContext>();
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IWebHostEnvironment env,
             ILoggerFactory loggerFactory, ILogger logger)
        {
            app.UseSerilogRequestLogging(opts =>
            {
                opts.EnrichDiagnosticContext = LogHelper.EnrichFromRequest;
                opts.GetLevel = LogHelper.CustomGetLevel;
            });
            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }
            else
            {
                app.UseExceptionHandler("/Home/Error");
                // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
                app.UseHsts();
            }

            app.UseHttpsRedirection();
            app.UseResponseCompression();
            app.UseRouting();
            app.UseCors(policy =>
            {
                //TODO: don't allow all origins
                policy.AllowAnyOrigin();
                policy.AllowAnyHeader();
                policy.AllowAnyMethod();
                policy.WithExposedHeaders("WWW-Authenticate");
            });

            app.UseAuthentication();
            app.UseAuthorization();
            app.UseMiddleware<LogHelper>();

            app.UseEndpoints(endpoints =>
            {
                endpoints.MapControllers();
                endpoints.MapHealthChecks("/healthz");
            });
            
        }
       
    }
}
