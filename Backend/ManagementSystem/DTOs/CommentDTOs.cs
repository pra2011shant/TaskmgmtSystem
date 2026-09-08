using System.ComponentModel.DataAnnotations;

namespace ManagementSystem.DTOs
{
    /// <summary>
    /// Request payload for submitting a discussion comment or reply.
    /// </summary>
    public class CreateCommentDto
    {
        [Required]
        [MaxLength(1000)]
        public string Content { get; set; } = string.Empty;

        public int? ParentCommentId { get; set; }
    }

    /// <summary>
    /// Request payload for updating an existing comment.
    /// </summary>
    public class UpdateCommentDto
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
        public int? ParentCommentId { get; set; }
        public bool IsEdited { get; set; } = false;
        public DateTime CreatedAt { get; set; }
        public List<CommentDto> Replies { get; set; } = new List<CommentDto>();
    }
}
