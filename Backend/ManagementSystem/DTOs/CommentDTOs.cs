using System.ComponentModel.DataAnnotations;

namespace ManagementSystem.DTOs
{
    /// <summary>
    /// Request payload for submitting a discussion comment on a work task.
    /// </summary>
    public class CreateCommentDto
    {
        [Required]
        [MaxLength(1000)]
        public string Content { get; set; } = string.Empty;
    }

    /// <summary>
    /// Response payload representing a task collaboration comment.
    /// </summary>
    public class CommentDto
    {
        public int Id { get; set; }
        public int TaskId { get; set; }
        public int UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string UserRole { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }
}
