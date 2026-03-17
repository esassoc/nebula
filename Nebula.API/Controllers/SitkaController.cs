using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Nebula.API.Services;
using Nebula.EFModels.Entities;

namespace Nebula.API.Controllers
{
    public abstract class SitkaController<T> : ControllerBase
    {
        protected readonly NebulaDbContext _dbContext;
        protected readonly ILogger<T> _logger;
        protected readonly NebulaConfiguration _nebulaConfiguration;

        protected SitkaController(NebulaDbContext dbContext, ILogger<T> logger, IOptions<NebulaConfiguration> nebulaConfiguration)
        {
            _dbContext = dbContext;
            _logger = logger;
            _nebulaConfiguration = nebulaConfiguration.Value;
        }

        protected ActionResult RequireNotNullThrowNotFound(object theObject, string objectType, object objectID)
        {
            return ThrowNotFound(theObject, objectType, objectID, out var actionResult) ? actionResult : Ok(theObject);
        }

        protected bool ThrowNotFound(object theObject, string objectType, object objectID, out ActionResult actionResult)
        {
            if (theObject == null)
            {
                var notFoundMessage = $"{objectType} with ID {objectID} does not exist!";
                _logger.LogError(notFoundMessage);
                {
                    actionResult = NotFound(notFoundMessage);
                    return true;
                }
            }

            actionResult = null;
            return false;
        }
    }
}