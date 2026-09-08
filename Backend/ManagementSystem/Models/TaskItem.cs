using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ManagementSystem.Models
{
    public enum TaskStatusEnum
    {
        Created = 0,
        Assigned = 1,
        ToDo = 2,
        InProgress = 3,
        Review = 4,
        Done = 5,
        Blocked = 6,
        Rejected = 7,
        Cancelled = 8
    }

    public enum TaskPriorityEnum
    {
        Low = 1,
        Medium = 2,
        High = 3,
        Critical = 4,
        Urgent = 4
    }

    public class TaskItem : BaseEntity
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        [MaxLength(4000)]
        public string Description { get; set; } = string.Empty;

        public new TaskStatusEnum Status { get; set; } = TaskStatusEnum.ToDo;

        public TaskPriorityEnum Priority { get; set; } = TaskPriorityEnum.Medium;

        [MaxLength(100)]
        public string? Category { get; set; } = "General";

        [MaxLength(500)]
        public string? Tags { get; set; }

        public double? EstimatedHours { get; set; }

        public double? ActualHours { get; set; }

        public DateTime? DueDate { get; set; }

        public int? TeamId { get; set; }

        [ForeignKey(nameof(TeamId))]
        public Team? Team { get; set; }

        public int? AssignedToUserId { get; set; }

        [ForeignKey(nameof(AssignedToUserId))]
        public User? AssignedToUser { get; set; }

        [NotMapped]
        public int CreatedByUserId
        {
            get => CreatedById ?? 1;
            set => CreatedById = value;
        }

        [ForeignKey(nameof(CreatedById))]
        public User CreatedByUser { get; set; } = null!;

        [NotMapped]
        public DateTime CreatedAt
        {
            get => CreatedDate;
            set => CreatedDate = value;
        }

        [NotMapped]
        public DateTime? UpdatedAt
        {
            get => LastUpdatedDate;
            set => LastUpdatedDate = value;
        }

        public ICollection<TaskComment> Comments { get; set; } = new List<TaskComment>();
        public ICollection<SubTask> SubTasks { get; set; } = new List<SubTask>();
        public ICollection<TaskAttachment> Attachments { get; set; } = new List<TaskAttachment>();
    }
}
