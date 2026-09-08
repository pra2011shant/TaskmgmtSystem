using System.ComponentModel.DataAnnotations;

namespace ManagementSystem.Models
{
    public class AuditLog
    {
        [Key]
        public long Id { get; set; }

        public int? UserId { get; set; }

        [MaxLength(100)]
        public string? UserName { get; set; }

        [MaxLength(50)]
        public string? UserRole { get; set; }

        [Required]
        [MaxLength(100)]
        public string Action { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string EntityName { get; set; } = string.Empty;

        [MaxLength(100)]
        public string? EntityId { get; set; }

        public string? OldValueJson { get; set; }

        public string? NewValueJson { get; set; }

        [MaxLength(50)]
        public string? IpAddress { get; set; }

        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }
}
