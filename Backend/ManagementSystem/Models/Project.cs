using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ManagementSystem.Models
{
    /// <summary>
    /// Database Table: [Projects]
    /// Purpose: Represents a top-level enterprise project containing milestones, dedicated teams, budget, and deliverables.
    /// </summary>
    [Table("Projects")]
    public class Project : BaseEntity
    {
        [Key]
        public int Id { get; set; }

        public int? OrganizationId { get; set; }

        public int? TeamId { get; set; }

        [ForeignKey(nameof(TeamId))]
        public Team? Team { get; set; }

        [Required]
        [MaxLength(20)]
        public string ProjectKey { get; set; } = string.Empty;

        [Required]
        [MaxLength(200)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(2000)]
        public string Description { get; set; } = string.Empty;

        public int? ManagerId { get; set; }

        [ForeignKey(nameof(ManagerId))]
        public User? Manager { get; set; }

        public DateTime? StartDate { get; set; }

        public DateTime? EndDate { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal? Budget { get; set; }

        public int ProjectStatus { get; set; } = 1; // 1 = Active, 2 = OnHold, 3 = Completed

        public ICollection<Milestone> Milestones { get; set; } = new List<Milestone>();
        public ICollection<TaskItem> Tasks { get; set; } = new List<TaskItem>();
    }
}
