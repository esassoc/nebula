using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;
using NetTopologySuite.Geometries;

namespace Nebula.EFModels.Entities;

[Table("BackboneSegment")]
public partial class BackboneSegment
{
    [Key]
    public int BackboneSegmentID { get; set; }

    [Required]
    [Column(TypeName = "geometry")]
    public Geometry BackboneSegmentGeometry { get; set; }

    public int CatchIDN { get; set; }

    public int BackboneSegmentTypeID { get; set; }

    public int? DownstreamBackboneSegmentID { get; set; }

    [Unicode(false)]
    public string StreamName { get; set; }

    [Column(TypeName = "geometry")]
    public Geometry BackboneSegmentGeometry4326 { get; set; }

    [ForeignKey("BackboneSegmentTypeID")]
    [InverseProperty("BackboneSegments")]
    public virtual BackboneSegmentType BackboneSegmentType { get; set; }

    [ForeignKey("DownstreamBackboneSegmentID")]
    [InverseProperty("InverseDownstreamBackboneSegment")]
    public virtual BackboneSegment DownstreamBackboneSegment { get; set; }

    [InverseProperty("DownstreamBackboneSegment")]
    public virtual ICollection<BackboneSegment> InverseDownstreamBackboneSegment { get; set; } = new List<BackboneSegment>();
}
