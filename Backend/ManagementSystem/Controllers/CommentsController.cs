using System.Security.Claims;
using ManagementSystem.DTOs;
using ManagementSystem.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ManagementSystem.Controllers
{
    /// <summary>
    /// RESTful API Controller facilitating collaborative task discussions, threaded replies, and @mentions.
    /// </summary>
    [Authorize]
    [ApiController]
    [Route("api")]
    public class CommentsController : ControllerBase
    {
        private readonly ITaskService _taskService;

        public CommentsController(ITaskService taskService)
        {
            _taskService = taskService;
        }

        private int CurrentUserId => int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : 1;
        private string CurrentUserRole => User.FindFirstValue(ClaimTypes.Role) ?? "User";
        private string? ClientIp => HttpContext.Connection.RemoteIpAddress?.ToString();

        /// <summary>
        /// Retrieves chronological discussion comments for a specific task (GET /api/tasks/{taskId}/comments).
        /// </summary>
        [HttpGet("tasks/{taskId}/comments")]
        public async Task<IActionResult> GetComments(int taskId)
        {
            var comments = await _taskService.GetCommentsAsync(taskId);
            return Ok(comments);
        }

        /// <summary>
        /// Appends a new discussion comment or reply to a task (POST /api/tasks/{taskId}/comments).
        /// </summary>
        [HttpPost("tasks/{taskId}/comments")]
        public async Task<IActionResult> AddComment(int taskId, [FromBody] CreateCommentDto dto)
        {
            if (!ModelState.IsValid || string.IsNullOrWhiteSpace(dto.Content))
            {
                return BadRequest(new { message = "Comment content cannot be empty." });
            }

            var (success, message, data) = await _taskService.AddCommentAsync(taskId, dto.Content, CurrentUserId, dto.ParentCommentId, ClientIp);
            if (!success) return BadRequest(new { message });

            return Ok(data);
        }

        /// <summary>
        /// Edits an existing comment (PUT /api/comments/{commentId}).
        /// </summary>
        [HttpPut("comments/{commentId}")]
        public async Task<IActionResult> UpdateComment(int commentId, [FromBody] UpdateCommentDto dto)
        {
            if (!ModelState.IsValid || string.IsNullOrWhiteSpace(dto.Content))
            {
                return BadRequest(new { message = "Comment content cannot be empty." });
            }

            var (success, message, data) = await _taskService.UpdateCommentAsync(commentId, dto.Content, CurrentUserId);
            if (!success) return BadRequest(new { message });

            return Ok(data);
        }

        /// <summary>
        /// Deletes a comment (DELETE /api/comments/{commentId}).
        /// </summary>
        [HttpDelete("comments/{commentId}")]
        public async Task<IActionResult> DeleteComment(int commentId)
        {
            var (success, message) = await _taskService.DeleteCommentAsync(commentId, CurrentUserId, CurrentUserRole);
            if (!success) return BadRequest(new { message });

            return Ok(new { success = true, message });
        }
    }
}
