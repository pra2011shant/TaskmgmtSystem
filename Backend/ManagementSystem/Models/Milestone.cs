using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ManagementSystem.Models
{
    /// <summary>
    /// Database Table: [Milestones]
    /// Purpose: Represents a major project phase or sprint deadline that groups tasks and computes completion percentage.
    /// </summary>
    [Table("Milestones")]
    public class Milestone : BaseEntity
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int ProjectId { get; set; }

        [ForeignKey(nameof(ProjectId))]
        public Project Project { get; set; } = null!;

        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        [MaxLength(1000)]
        public string Description { get; set; } = string.Empty;

        public DateTime DueDate { get; set; }

        [Column(TypeName = "decimal(5,2)")]
        public decimal ProgressPercentage { get; set; } = 0.00m;

        [NotMapped]
        public int MilestoneStatus
        {
            get => Status;
            set => Status = value;
        }

        public ICollection<TaskItem> Tasks { get; set; } = new List<TaskItem>();
    }
}
