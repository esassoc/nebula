using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Nebula.API.Services;
using Nebula.API.Services.Authorization;
using Nebula.EFModels.Entities;
using Nebula.Models.DataTransferObjects;

namespace Nebula.API.Controllers
{
    [ApiController]
    public class CustomRichTextController : SitkaController<CustomRichTextController>
    {
        public CustomRichTextController(NebulaDbContext dbContext, ILogger<CustomRichTextController> logger, IOptions<NebulaConfiguration> nebulaConfiguration) : base(dbContext, logger, nebulaConfiguration)
        {
        }

        [HttpGet("public/customRichText/{customRichTextTypeID}")]
        public ActionResult<CustomRichTextDto> GetCustomRichText([FromRoute] int customRichTextTypeID)
        {
            var customRichTextDto = CustomRichText.GetByCustomRichTextTypeID(_dbContext, customRichTextTypeID);
            return RequireNotNullThrowNotFound(customRichTextDto, "CustomRichText", customRichTextTypeID);
        }

        [HttpPut("customRichText/{customRichTextTypeID}")]
        [AdminFeature]
        public ActionResult<CustomRichTextDto> UpdateCustomRichText([FromRoute] int customRichTextTypeID, [FromBody] CustomRichTextDto customRichTextUpdateDto)
        {
            var customRichTextDto = CustomRichText.GetByCustomRichTextTypeID(_dbContext, customRichTextTypeID);
            if (ThrowNotFound(customRichTextDto, "CustomRichText", customRichTextTypeID, out var actionResult))
            {
                return actionResult;
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var updatedCustomRichTextDto =
                CustomRichText.UpdateCustomRichText(_dbContext, customRichTextTypeID, customRichTextUpdateDto);
            return Ok(updatedCustomRichTextDto);
        }
    }
}
