using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ManagementSystem.Models
{
    /// <summary>
    /// Database Table: [TaskViews]
    /// Purpose: Tracks when users open and inspect tasks for read/seen compliance and collaboration transparency.
    /// </summary>
    [Table("TaskViews")]
    public class TaskView
    {
        [Key]
        public long Id { get; set; }

        [Required]
        public int TaskId { get; set; }

        [ForeignKey("TaskId")]
        public virtual TaskItem? Task { get; set; }

        [Required]
        public int UserId { get; set; }

        [ForeignKey("UserId")]
        public virtual User? User { get; set; }

        [MaxLength(100)]
        public string? UserName { get; set; }

        [MaxLength(50)]
        public string? UserRole { get; set; }

        [MaxLength(50)]
        public string? IpAddress { get; set; }

        public DateTime ViewedAt { get; set; } = DateTime.UtcNow;
    }
}
