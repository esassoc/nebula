using System.Collections.Generic;
using System.Linq;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Nebula.API.Services;
using Nebula.API.Services.Authorization;
using Nebula.EFModels.Entities;
using Nebula.Models.DataTransferObjects;
using Nebula.Models.DataTransferObjects.Watershed;
using NetTopologySuite.Features;
using NetTopologySuite.Operation.Union;
using Qanat.API.GeoSpatial;

namespace Nebula.API.Controllers
{
    [ApiController]
    public class WatershedController : SitkaController<WatershedController>
    {
        public WatershedController(NebulaDbContext dbContext, ILogger<WatershedController> logger, IOptions<NebulaConfiguration> nebulaConfiguration) : base(dbContext, logger, nebulaConfiguration)
        {
        }

        [HttpGet("/watersheds")]
        [DataExplorerFeature]
        public ActionResult<List<WatershedDto>> ListAllWatersheds()
        {
            var watershedDtos = Watershed.List(_dbContext).OrderBy(x => x.WatershedName).ToList();
            return watershedDtos;
        }

        [HttpGet("/watersheds/{watershedID}")]
        [DataExplorerFeature]
        public ActionResult<WatershedDto> GetWatershedByID([FromRoute] int watershedID)
        {
            var watershedDto = Watershed.GetByWatershedID(_dbContext, watershedID);
            return RequireNotNullThrowNotFound(watershedDto, "Watershed", watershedID);
        }

        [HttpPost("watersheds/getBoundingBox")]
        [DataExplorerFeature]
        public ActionResult<BoundingBoxDto> GetBoundingBoxByWatershedIDs([FromBody] WatershedIDListDto watershedIDListDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var boundingBoxDto = Watershed.GetBoundingBoxByWatershedIDs(_dbContext, watershedIDListDto.WatershedIDs);
            return Ok(boundingBoxDto);
        }

        [HttpGet("watersheds/{watershedName}/get-watershed-mask")]
        public ActionResult<string> GetWatershedMask([FromRoute] string watershedName)
        {
            var geometry = watershedName != "All Watersheds"
                ? _dbContext.Watersheds
                    .SingleOrDefault(x => x.WatershedName == watershedName)
                    ?.WatershedGeometry4326
                : UnaryUnionOp.Union(_dbContext.Watersheds.Select(x => x.WatershedGeometry4326));

            var geoJson = GeoJsonHelpers.WriteFeaturesToGeoJsonString(new List<Feature> { new Feature() { Geometry = geometry } }, 2);
            return Ok(geoJson);
        }
    }
}