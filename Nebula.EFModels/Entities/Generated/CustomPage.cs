using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace Nebula.EFModels.Entities;

[Table("CustomPage")]
[Index("CustomPageDisplayName", Name = "AK_CustomPage_CustomPageDisplayName", IsUnique = true)]
[Index("CustomPageVanityUrl", Name = "AK_CustomPage_CustomPageVanityUrl", IsUnique = true)]
public partial class CustomPage
{
    [Key]
    public int CustomPageID { get; set; }

    [Required]
    [StringLength(100)]
    [Unicode(false)]
    public string CustomPageDisplayName { get; set; }

    [Required]
    [StringLength(100)]
    [Unicode(false)]
    public string CustomPageVanityUrl { get; set; }

    [Unicode(false)]
    public string CustomPageContent { get; set; }

    public int MenuItemID { get; set; }

    public int? SortOrder { get; set; }

    [InverseProperty("CustomPage")]
    public virtual ICollection<CustomPageRole> CustomPageRoles { get; set; } = new List<CustomPageRole>();
}
