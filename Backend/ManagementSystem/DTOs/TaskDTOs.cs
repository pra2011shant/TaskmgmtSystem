using System.ComponentModel.DataAnnotations;
using ManagementSystem.Models;

namespace ManagementSystem.DTOs
{
    public class SubTaskDto
    {
        public int Id { get; set; }
        public int TaskId { get; set; }
        public string Title { get; set; } = string.Empty;
        public bool IsCompleted { get; set; }
        public int SortOrder { get; set; }
        public DateTime CreatedDate { get; set; }
    }

    public class CreateSubTaskDto
    {
        [Required]
        [MaxLength(250)]
        public string Title { get; set; } = string.Empty;
        public int SortOrder { get; set; } = 0;
    }

    public class UpdateSubTaskDto
    {
        [Required]
        [MaxLength(250)]
        public string Title { get; set; } = string.Empty;
        public bool IsCompleted { get; set; }
        public int SortOrder { get; set; }
    }

    public class TaskAttachmentDto
    {
        public int Id { get; set; }
        public int TaskId { get; set; }
        public string FileName { get; set; } = string.Empty;
        public string ContentType { get; set; } = string.Empty;
        public long FileSize { get; set; }
        public int UploadedById { get; set; }
        public string UploadedByUserName { get; set; } = string.Empty;
        public DateTime CreatedDate { get; set; }
        public string DownloadUrl { get; set; } = string.Empty;
    }

    /// <summary>
    /// Request payload for provisioning a new work task.
    /// </summary>
    public class CreateTaskDto
    {
        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        [MaxLength(4000)]
        public string Description { get; set; } = string.Empty;

        public TaskStatusEnum Status { get; set; } = TaskStatusEnum.ToDo;

        public TaskPriorityEnum Priority { get; set; } = TaskPriorityEnum.Medium;

        [MaxLength(100)]
        public string? Category { get; set; } = "General";

        [MaxLength(500)]
        public string? Tags { get; set; }

        public double? EstimatedHours { get; set; }

        public double? ActualHours { get; set; }

        public DateTime? DueDate { get; set; }

        public int? TeamId { get; set; }

        public int? AssignedToUserId { get; set; }

        [MaxLength(500)]
        public string? Remarks { get; set; }

        public List<string>? InitialSubtasks { get; set; }
    }

    /// <summary>
    /// Request payload for modifying all mutable fields of an existing task.
    /// </summary>
    public class UpdateTaskDto
    {
        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        [MaxLength(4000)]
        public string Description { get; set; } = string.Empty;

        public TaskStatusEnum Status { get; set; }

        public TaskPriorityEnum Priority { get; set; }

        [MaxLength(100)]
        public string? Category { get; set; }

        [MaxLength(500)]
        public string? Tags { get; set; }

        public double? EstimatedHours { get; set; }

        public double? ActualHours { get; set; }

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
        public string Category { get; set; } = "General";
        public string? Tags { get; set; }
        public double? EstimatedHours { get; set; }
        public double? ActualHours { get; set; }
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
        public int SubtasksCount { get; set; }
        public int CompletedSubtasksCount { get; set; }
        public int AttachmentsCount { get; set; }
        public string? Remarks { get; set; }
        public bool IsDeleted { get; set; }
        public DateTime CreatedDate { get; set; }
        public DateTime? LastUpdatedDate { get; set; }
        public int? CreatedById { get; set; }
        public List<SubTaskDto> SubTasks { get; set; } = new List<SubTaskDto>();
        public List<TaskAttachmentDto> Attachments { get; set; } = new List<TaskAttachmentDto>();
    }

    /// <summary>
    /// Query filter parameters for multi-criteria task search and evaluation.
    /// </summary>
    public class TaskFilterDto
    {
        public string? Search { get; set; }
        public TaskStatusEnum? Status { get; set; }
        public TaskPriorityEnum? Priority { get; set; }
        public string? Category { get; set; }
        public string? Tag { get; set; }
        public int? TeamId { get; set; }
        public int? AssignedToUserId { get; set; }
        public bool? IsOverdue { get; set; }
        public DateTime? DueDateFrom { get; set; }
        public DateTime? DueDateTo { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 50;
        public string? SortBy { get; set; }
        public bool SortDescending { get; set; } = false;
    }
}
