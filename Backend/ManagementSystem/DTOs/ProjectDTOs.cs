using System.ComponentModel.DataAnnotations;

namespace ManagementSystem.DTOs
{
    public class MilestoneDto
    {
        public int Id { get; set; }
        public int ProjectId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public DateTime DueDate { get; set; }
        public decimal ProgressPercentage { get; set; }
        public int MilestoneStatus { get; set; }
        public int TasksCount { get; set; }
        public int CompletedTasksCount { get; set; }
    }

    public class CreateMilestoneDto
    {
        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        [MaxLength(1000)]
        public string Description { get; set; } = string.Empty;

        public DateTime DueDate { get; set; }
    }

    public class ProjectDto
    {
        public int Id { get; set; }
        public string ProjectKey { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int? TeamId { get; set; }
        public string? TeamName { get; set; }
        public int? ManagerId { get; set; }
        public string? ManagerName { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public decimal? Budget { get; set; }
        public int ProjectStatus { get; set; }
        public int TasksCount { get; set; }
        public int CompletedTasksCount { get; set; }
        public decimal CompletionRate { get; set; }
        public List<MilestoneDto> Milestones { get; set; } = new List<MilestoneDto>();
    }

    public class CreateProjectDto
    {
        [Required]
        [MaxLength(20)]
        public string ProjectKey { get; set; } = string.Empty;

        [Required]
        [MaxLength(200)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(2000)]
        public string Description { get; set; } = string.Empty;

        public int? TeamId { get; set; }
        public int? ManagerId { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public decimal? Budget { get; set; }
    }
}
