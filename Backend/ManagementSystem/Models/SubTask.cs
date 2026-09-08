using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ManagementSystem.Models
{
    public class SubTask : BaseEntity
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int TaskId { get; set; }

        [ForeignKey(nameof(TaskId))]
        public TaskItem Task { get; set; } = null!;

        [Required]
        [MaxLength(250)]
        public string Title { get; set; } = string.Empty;

        public bool IsCompleted { get; set; } = false;

        public int SortOrder { get; set; } = 0;
    }
}
