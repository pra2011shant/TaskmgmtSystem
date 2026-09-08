using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ManagementSystem.Models
{
    /// <summary>
    /// Database Table: [TaskTemplates]
    /// Purpose: Stores reusable task blueprints (e.g., 'Employee Onboarding', 'Security Release Audit') with default subtasks.
    /// </summary>
    [Table("TaskTemplates")]
    public class TaskTemplate : BaseEntity
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(150)]
        public string TemplateName { get; set; } = string.Empty;

        [MaxLength(100)]
        public string Category { get; set; } = "Engineering";

        [Required]
        [MaxLength(200)]
        public string DefaultTitle { get; set; } = string.Empty;

        [MaxLength(2000)]
        public string DefaultDescription { get; set; } = string.Empty;

        public double EstimatedHours { get; set; } = 8.0;

        public string? DefaultSubtasksJson { get; set; }
    }
}
