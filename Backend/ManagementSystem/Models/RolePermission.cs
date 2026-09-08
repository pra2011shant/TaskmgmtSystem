using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ManagementSystem.Models
{
    /// <summary>
    /// Database Table: [RolePermissions]
    /// Purpose: Granular permission overrides mapped to system user roles.
    /// </summary>
    [Table("RolePermissions")]
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
