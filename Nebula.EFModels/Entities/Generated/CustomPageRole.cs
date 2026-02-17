using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace Nebula.EFModels.Entities;

[Table("CustomPageRole")]
public partial class CustomPageRole
{
    [Key]
    public int CustomPageRoleID { get; set; }

    public int CustomPageID { get; set; }

    public int RoleID { get; set; }

    [ForeignKey("CustomPageID")]
    [InverseProperty("CustomPageRoles")]
    public virtual CustomPage CustomPage { get; set; }
}
