using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using Nebula.Models.DataTransferObjects;
using Nebula.Models.DataTransferObjects.Watershed;

namespace Nebula.EFModels.Entities
{
    public partial class Watershed
    {
        /// <summary>
        /// SQL-translatable projection onto <see cref="WatershedDto"/>.
        ///
        /// AsDto() is a plain extension method, so EF Core cannot translate
        /// .Select(x => x.AsDto()) and instead evaluates it client-side in the
        /// final projection -- meaning it fetched every column of every row.
        /// For Watershed that included BOTH spatial columns
        /// (WatershedGeometry and WatershedGeometry4326), neither of which
        /// WatershedDto even carries, on an endpoint the frontend hits from
        /// several pages.
        ///
        /// Keep this in sync with the generated AsDto(). It is equivalent
        /// today because Watershed implements no DoCustomMappings hook; if one
        /// is ever added, this projection would bypass it.
        /// </summary>
        private static readonly Expression<Func<Watershed, WatershedDto>> DtoProjection = x => new WatershedDto
        {
            WatershedID = x.WatershedID,
            WatershedName = x.WatershedName
        };

        public static List<WatershedDto> List(NebulaDbContext dbContext)
        {
            return GetWatershedsImpl(dbContext).Select(DtoProjection).ToList();
        }

        public static WatershedDto GetByWatershedID(NebulaDbContext dbContext, int watershedID)
        {
            return GetWatershedsImpl(dbContext)
                .Where(x => x.WatershedID == watershedID)
                .Select(DtoProjection)
                .SingleOrDefault();
        }

        public static List<WatershedDto> GetByWatershedID(NebulaDbContext dbContext, List<int> watershedIDs)
        {
            return GetWatershedsImpl(dbContext)
                .Where(x => watershedIDs.Contains(x.WatershedID))
                .Select(DtoProjection)
                .ToList();
        }

        private static IQueryable<Watershed> GetWatershedsImpl(NebulaDbContext dbContext)
        {
            return dbContext.Watersheds.AsNoTracking();
        }

        public static BoundingBoxDto GetBoundingBoxByWatershedIDs(NebulaDbContext dbContext, List<int> watershedIDs)
        {
            var watersheds = dbContext.Watersheds
                .AsNoTracking()
                .Where(x => watershedIDs.Contains(x.WatershedID));

            var geometries = watersheds.Select(x => x.WatershedGeometry4326).ToList();
            return new BoundingBoxDto(geometries);
        }
    }
}