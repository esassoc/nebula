using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Nebula.API.Services;
using Nebula.API.Services.Authorization;
using Nebula.EFModels.Entities;

namespace Nebula.API.Controllers
{
    [ApiController]
    public class RoleController : SitkaController<RoleController>
    {
        public RoleController(NebulaDbContext dbContext, ILogger<RoleController> logger, IOptions<NebulaConfiguration> nebulaConfiguration) : base(dbContext, logger, nebulaConfiguration)
        {
        }

        [HttpGet("roles")]
        [AdminFeature]
        public IActionResult Get()
        {
            var roleDtos = Role.AllAsDto;
            return Ok(roleDtos);
        }
    }
}