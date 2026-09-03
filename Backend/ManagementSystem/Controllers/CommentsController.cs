using System.Security.Claims;
using ManagementSystem.DTOs;
using ManagementSystem.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ManagementSystem.Controllers
{
    /// <summary>
    /// RESTful API Controller facilitating collaborative task discussions and stakeholder comments.
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

        private int CurrentUserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

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
        /// Appends a new discussion comment to a task and dispatches notification alerts (POST /api/tasks/{taskId}/comments).
        /// </summary>
        [HttpPost("tasks/{taskId}/comments")]
        public async Task<IActionResult> AddComment(int taskId, [FromBody] CreateCommentDto dto)
        {
            if (!ModelState.IsValid || string.IsNullOrWhiteSpace(dto.Content))
            {
                return BadRequest(new { message = "Comment content cannot be empty." });
            }

            var (success, message, data) = await _taskService.AddCommentAsync(taskId, dto.Content, CurrentUserId);
            if (!success) return BadRequest(new { message });

            return Ok(data);
        }
    }
}
