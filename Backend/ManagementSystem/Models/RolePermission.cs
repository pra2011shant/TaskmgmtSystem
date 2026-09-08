using System.ComponentModel.DataAnnotations;

namespace ManagementSystem.Models
{
    public class RolePermission : BaseEntity
    {
        [Key]
        public int Id { get; set; }

        public UserRole Role { get; set; }

        [Required]
        [MaxLength(100)]
        public string Permission { get; set; } = string.Empty;

        public bool IsGranted { get; set; } = true;
    }
}
