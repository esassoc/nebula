using System.Collections.Generic;
using Nebula.API.Services;
using Nebula.EFModels.Entities;
using Nebula.Models.DataTransferObjects;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Nebula.API.Controllers
{
    public class MenuItemController : SitkaController<MenuItemController>
    {
        [HttpGet("menuItems")]
        public ActionResult<IEnumerable<MenuItemDto>> GetMenuItems()
        {
            var menuItemsDto = MenuItem.AllAsDto;
            return Ok(menuItemsDto);
        }

        public MenuItemController(NebulaDbContext dbContext, ILogger<MenuItemController> logger, IOptions<NebulaConfiguration> nebulaConfiguration) : base(dbContext, logger, nebulaConfiguration)
        {
        }
    }
}