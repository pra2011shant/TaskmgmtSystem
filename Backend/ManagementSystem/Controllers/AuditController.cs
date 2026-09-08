using System.Security.Claims;
using ManagementSystem.Models;
using ManagementSystem.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ManagementSystem.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class AuditController : ControllerBase
    {
        private readonly IAuditService _auditService;

        public AuditController(IAuditService auditService)
        {
            _auditService = auditService;
        }

        private int CurrentUserId => int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : 1;
        private string CurrentUserName => User.FindFirstValue(ClaimTypes.Name) ?? "User";
        private string CurrentUserRole => User.FindFirstValue(ClaimTypes.Role) ?? "User";
        private string? ClientIp => HttpContext.Connection.RemoteIpAddress?.ToString();

        /// <summary>
        /// Retrieves filtered audit trail logs (Admin only).
        /// </summary>
        [Authorize(Roles = "Admin")]
        [HttpGet]
        public async Task<IActionResult> GetLogs(
            [FromQuery] string? search,
            [FromQuery] string? entityName,
            [FromQuery] string? module,
            [FromQuery] string? action,
            [FromQuery] int? userId,
            [FromQuery] DateTime? fromDate,
            [FromQuery] DateTime? toDate,
            [FromQuery] int limit = 100)
        {
            var logs = await _auditService.GetLogsAsync(search, entityName, module, action, userId, fromDate, toDate, limit);
            return Ok(logs);
        }

        /// <summary>
        /// Retrieves system activity overview metrics (Admin only).
        /// </summary>
        [Authorize(Roles = "Admin")]
        [HttpGet("stats")]
        public async Task<IActionResult> GetActivityStats()
        {
            var stats = await _auditService.GetActivityStatsAsync();
            return Ok(stats);
        }

        /// <summary>
        /// Retrieves real-time user presence and session status list (Admin only).
        /// </summary>
        [Authorize(Roles = "Admin")]
        [HttpGet("presence")]
        public async Task<IActionResult> GetUserPresence()
        {
            var presence = await _auditService.GetUserPresenceListAsync();
            return Ok(presence);
        }

        /// <summary>
        /// Records or updates client activity heartbeat.
        /// </summary>
        [HttpPost("presence/heartbeat")]
        public async Task<IActionResult> Heartbeat()
        {
            var userAgent = Request.Headers.UserAgent.ToString();
            await _auditService.UpdateUserPresenceAsync(CurrentUserId, isOnline: true, ipAddress: ClientIp, userAgent: userAgent);
            return Ok(new { success = true, timestamp = DateTime.UtcNow });
        }

        /// <summary>
        /// Records that a user has viewed/opened a specific task.
        /// </summary>
        [HttpPost("task-views/{taskId}")]
        public async Task<IActionResult> RecordTaskView(int taskId)
        {
            await _auditService.RecordTaskViewAsync(taskId, CurrentUserId, CurrentUserName, CurrentUserRole, ClientIp);
            return Ok(new { success = true });
        }

        /// <summary>
        /// Retrieves seen/view history for a specific task.
        /// </summary>
        [HttpGet("task-views/{taskId}")]
        public async Task<IActionResult> GetTaskViews(int taskId)
        {
            var views = await _auditService.GetTaskViewsAsync(taskId);
            return Ok(views);
        }
    }
}

