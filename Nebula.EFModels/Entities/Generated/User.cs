using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace Nebula.EFModels.Entities;

[Table("User")]
[Index("Email", Name = "AK_User_Email", IsUnique = true)]
public partial class User
{
    [Key]
    public int UserID { get; set; }

    public Guid? LegacyUserGuid { get; set; }

    [StringLength(254)]
    [Unicode(false)]
    public string GlobalUserID { get; set; }

    [Required]
    [StringLength(100)]
    [Unicode(false)]
    public string FirstName { get; set; }

    [Required]
    [StringLength(100)]
    [Unicode(false)]
    public string LastName { get; set; }

    [Required]
    [StringLength(255)]
    [Unicode(false)]
    public string Email { get; set; }

    [StringLength(30)]
    [Unicode(false)]
    public string Phone { get; set; }

    public int RoleID { get; set; }

    [Column(TypeName = "datetime")]
    public DateTime CreateDate { get; set; }

    [Column(TypeName = "datetime")]
    public DateTime? UpdateDate { get; set; }

    [Column(TypeName = "datetime")]
    public DateTime? LastActivityDate { get; set; }

    [Column(TypeName = "datetime")]
    public DateTime? DisclaimerAcknowledgedDate { get; set; }

    public bool IsActive { get; set; }

    public bool ReceiveSupportEmails { get; set; }

    [StringLength(128)]
    [Unicode(false)]
    public string LoginName { get; set; }

    [StringLength(100)]
    [Unicode(false)]
    public string Company { get; set; }
}
