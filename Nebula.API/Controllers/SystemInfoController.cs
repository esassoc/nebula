using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Nebula.API.Services;
using Nebula.EFModels.Entities;
using Nebula.Models.DataTransferObjects;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Nebula.API.Services.Authorization;
using Qanat.Models.DataTransferObjects;

namespace Nebula.API.Controllers
{
    [ApiController]
    public class SystemInfoController : SitkaController<SystemInfoController>
    {

        public SystemInfoController(NebulaDbContext dbContext, ILogger<SystemInfoController> logger, IOptions<NebulaConfiguration> nebulaConfiguration)
            : base(dbContext, logger, nebulaConfiguration)
        {
        }

        [HttpGet("/", Name = "GetSystemInfo")]
        [AllowAnonymous]
        public ActionResult<SystemInfoDto> GetSystemInfo([FromServices] IWebHostEnvironment environment)
        {
            SystemInfoDto systemInfo = new SystemInfoDto
            {
                Environment = environment.EnvironmentName,
                CurrentTimeUTC = DateTime.UtcNow.ToString("o"),
                PodName = _nebulaConfiguration.HostName
            };
            return Ok(systemInfo);
        }

    }
}