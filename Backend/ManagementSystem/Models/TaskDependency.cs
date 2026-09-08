using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ManagementSystem.Models
{
    /// <summary>
    /// Database Table: [TaskDependencies]
    /// Purpose: Tracks predecessor/successor relationships where Task A blocks Task B (Finish-to-Start workflow).
    /// </summary>
    [Table("TaskDependencies")]
    public class TaskDependency
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int TaskId { get; set; }

        [ForeignKey(nameof(TaskId))]
        public TaskItem Task { get; set; } = null!;

        [Required]
        public int DependsOnTaskId { get; set; }

        [ForeignKey(nameof(DependsOnTaskId))]
        public TaskItem DependsOnTask { get; set; } = null!;

        [MaxLength(50)]
        public string DependencyType { get; set; } = "FinishToStart";

        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
    }
}
