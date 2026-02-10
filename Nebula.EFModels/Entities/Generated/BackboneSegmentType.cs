using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace Nebula.EFModels.Entities;

[Table("BackboneSegmentType")]
[Index("BackboneSegmentTypeDisplayName", Name = "AK_BackboneSegmentType_BackboneSegmentTypeDisplayName", IsUnique = true)]
[Index("BackboneSegmentTypeName", Name = "AK_BackboneSegmentType_BackboneSegmentTypeName", IsUnique = true)]
public partial class BackboneSegmentType
{
    [Key]
    public int BackboneSegmentTypeID { get; set; }

    [Required]
    [StringLength(20)]
    [Unicode(false)]
    public string BackboneSegmentTypeName { get; set; }

    [Required]
    [StringLength(20)]
    [Unicode(false)]
    public string BackboneSegmentTypeDisplayName { get; set; }

    [InverseProperty("BackboneSegmentType")]
    public virtual ICollection<BackboneSegment> BackboneSegments { get; set; } = new List<BackboneSegment>();
}
