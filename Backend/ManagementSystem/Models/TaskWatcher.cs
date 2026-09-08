using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ManagementSystem.Models
{
    /// <summary>
    /// Database Table: [TaskWatchers]
    /// Purpose: Associates observers/followers with a task so stakeholders receive notifications without being direct assignees.
    /// </summary>
    [Table("TaskWatchers")]
    public class TaskWatcher
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int TaskId { get; set; }

        [ForeignKey(nameof(TaskId))]
        public TaskItem Task { get; set; } = null!;

        [Required]
        public int UserId { get; set; }

        [ForeignKey(nameof(UserId))]
        public User User { get; set; } = null!;

        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
    }
}
