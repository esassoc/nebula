using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;
using NetTopologySuite.Geometries;

namespace Nebula.EFModels.Entities;

[Table("RegionalSubbasin")]
[Index("OCSurveyCatchmentID", Name = "AK_RegionalSubbasin_OCSurveyCatchmentID", IsUnique = true)]
public partial class RegionalSubbasin
{
    [Key]
    public int RegionalSubbasinID { get; set; }

    [StringLength(10)]
    [Unicode(false)]
    public string DrainID { get; set; }

    [StringLength(100)]
    [Unicode(false)]
    public string Watershed { get; set; }

    [Required]
    [Column(TypeName = "geometry")]
    public Geometry CatchmentGeometry { get; set; }

    public int OCSurveyCatchmentID { get; set; }

    public int? OCSurveyDownstreamCatchmentID { get; set; }

    [Column(TypeName = "geometry")]
    public Geometry CatchmentGeometry4326 { get; set; }

    [Column(TypeName = "datetime")]
    public DateTime? LastUpdate { get; set; }

    [InverseProperty("OCSurveyDownstreamCatchment")]
    public virtual ICollection<RegionalSubbasin> InverseOCSurveyDownstreamCatchment { get; set; } = new List<RegionalSubbasin>();

    [ForeignKey("OCSurveyDownstreamCatchmentID")]
    [InverseProperty("InverseOCSurveyDownstreamCatchment")]
    public virtual RegionalSubbasin OCSurveyDownstreamCatchment { get; set; }
}
