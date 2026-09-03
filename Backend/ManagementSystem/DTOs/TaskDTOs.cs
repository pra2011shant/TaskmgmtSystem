using System.ComponentModel.DataAnnotations;
using ManagementSystem.Models;

namespace ManagementSystem.DTOs
{
    /// <summary>
    /// Request payload for provisioning a new work task.
    /// </summary>
    public class CreateTaskDto
    {
        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        [MaxLength(2000)]
        public string Description { get; set; } = string.Empty;

        public TaskStatusEnum Status { get; set; } = TaskStatusEnum.ToDo;

        public TaskPriorityEnum Priority { get; set; } = TaskPriorityEnum.Medium;

        public DateTime? DueDate { get; set; }

        public int? TeamId { get; set; }

        public int? AssignedToUserId { get; set; }

        [MaxLength(500)]
        public string? Remarks { get; set; }
    }

    /// <summary>
    /// Request payload for modifying all mutable fields of an existing task.
    /// </summary>
    public class UpdateTaskDto
    {
        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        [MaxLength(2000)]
        public string Description { get; set; } = string.Empty;

        public TaskStatusEnum Status { get; set; }

        public TaskPriorityEnum Priority { get; set; }

        public DateTime? DueDate { get; set; }

        public int? TeamId { get; set; }

        public int? AssignedToUserId { get; set; }

        [MaxLength(500)]
        public string? Remarks { get; set; }
    }

    /// <summary>
    /// Lightweight request payload for executing status transitions.
    /// </summary>
    public class UpdateTaskStatusDto
    {
        [Required]
        public TaskStatusEnum Status { get; set; }
    }

    /// <summary>
    /// Comprehensive task entity response payload delivered to clients.
    /// </summary>
    public class TaskDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public int StatusValue { get; set; }
        public string Priority { get; set; } = string.Empty;
        public int PriorityValue { get; set; }
        public DateTime? DueDate { get; set; }
        public int? TeamId { get; set; }
        public string? TeamName { get; set; }
        public int? AssignedToUserId { get; set; }
        public string? AssignedToUserName { get; set; }
        public string? AssignedToUserEmail { get; set; }
        public int CreatedByUserId { get; set; }
        public string CreatedByUserName { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public int CommentsCount { get; set; }
        public string? Remarks { get; set; }
        public bool IsDeleted { get; set; }
        public DateTime CreatedDate { get; set; }
        public DateTime? LastUpdatedDate { get; set; }
        public int? CreatedById { get; set; }
    }

    /// <summary>
    /// Query filter parameters for multi-criteria task search and evaluation.
    /// </summary>
    public class TaskFilterDto
    {
        public string? Search { get; set; }
        public TaskStatusEnum? Status { get; set; }
        public TaskPriorityEnum? Priority { get; set; }
        public int? TeamId { get; set; }
        public int? AssignedToUserId { get; set; }
        public bool? IsOverdue { get; set; }
    }
}
