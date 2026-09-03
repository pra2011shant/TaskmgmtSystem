using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ManagementSystem.Models
{
    public enum TaskStatusEnum
    {
        ToDo = 1,
        InProgress = 2,
        Done = 3
    }

    public enum TaskPriorityEnum
    {
        Low = 1,
        Medium = 2,
        High = 3,
        Urgent = 4
    }

    public class TaskItem : BaseEntity
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        [MaxLength(2000)]
        public string Description { get; set; } = string.Empty;

        public new TaskStatusEnum Status { get; set; } = TaskStatusEnum.ToDo;

        public TaskPriorityEnum Priority { get; set; } = TaskPriorityEnum.Medium;

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
    }
}
