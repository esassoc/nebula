using System.ComponentModel.DataAnnotations;

namespace Nebula.Models.DataTransferObjects.User
{
    public class UserCreateDto
    {
        [Required]
        public string FirstName { get; set; }
        [Required]
        public string LastName { get; set; }
        [Required]
        public string Email { get; set; }
        [Required]
        public string LoginName { get; set; }
        [Required]
        public string GlobalUserID { get; set; }
    }
}