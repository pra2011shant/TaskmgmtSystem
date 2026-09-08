using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ManagementSystem.Models
{
    public class TaskComment : BaseEntity
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

        public int? ParentCommentId { get; set; }

        [ForeignKey(nameof(ParentCommentId))]
        public TaskComment? ParentComment { get; set; }

        [Required]
        [MaxLength(1000)]
        public string Content { get; set; } = string.Empty;

        public bool IsEdited { get; set; } = false;

        [NotMapped]
        public DateTime CreatedAt
        {
            get => CreatedDate;
            set => CreatedDate = value;
        }

        public ICollection<TaskComment> Replies { get; set; } = new List<TaskComment>();
    }
}
