using System.ComponentModel.DataAnnotations;

namespace ManagementSystem.Models
{
    public abstract class BaseEntity
    {
        [MaxLength(500)]
        public string? Remarks { get; set; }

        public int Status { get; set; } = 1;

        public bool IsDeleted { get; set; } = false;

        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

        public DateTime? LastUpdatedDate { get; set; }

        public int? CreatedById { get; set; }
    }
}
