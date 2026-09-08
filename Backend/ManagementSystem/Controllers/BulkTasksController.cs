using System.Security.Claims;
using ManagementSystem.Data;
using ManagementSystem.Models;
using ManagementSystem.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ManagementSystem.Controllers
{
    public class BulkStatusDto
    {
        public List<int> TaskIds { get; set; } = new();
        public TaskStatusEnum NewStatus { get; set; }
    }

    public class BulkAssignDto
    {
        public List<int> TaskIds { get; set; } = new();
        public int AssignedToUserId { get; set; }
    }

    public class BulkPriorityDto
    {
        public List<int> TaskIds { get; set; } = new();
        public TaskPriorityEnum NewPriority { get; set; }
    }

    public class BulkDeleteDto
    {
        public List<int> TaskIds { get; set; } = new();
    }

    /// <summary>
    /// REST API Controller for Bulk Batch Operations on Tasks (Bulk Status, Assign, Priority, and Delete).
    /// </summary>
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class BulkTasksController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IAuditService _auditService;
        private readonly INotificationService _notificationService;

        public BulkTasksController(AppDbContext context, IAuditService auditService, INotificationService notificationService)
        {
            _context = context;
            _auditService = auditService;
            _notificationService = notificationService;
        }

        private int CurrentUserId => int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : 1;
        private string? ClientIp => HttpContext.Connection.RemoteIpAddress?.ToString();

        /// <summary>
        /// Updates the status of multiple tasks at once.
        /// </summary>
        [HttpPost("status")]
        public async Task<IActionResult> BulkUpdateStatus([FromBody] BulkStatusDto dto)
        {
            if (dto.TaskIds == null || dto.TaskIds.Count == 0) return BadRequest(new { message = "No task IDs provided" });

            var tasks = await _context.Tasks.Where(t => dto.TaskIds.Contains(t.Id) && !t.IsDeleted).ToListAsync();
            var now = DateTime.UtcNow;

            foreach (var task in tasks)
            {
                task.Status = dto.NewStatus;
                task.LastUpdatedDate = now;
            }

            await _context.SaveChangesAsync();
            await _auditService.LogAsync("BulkUpdateStatus", "Tasks", null, null, $"Updated {tasks.Count} tasks to status {dto.NewStatus}", CurrentUserId, ipAddress: ClientIp);

            return Ok(new { message = $"Successfully updated {tasks.Count} tasks.", updatedCount = tasks.Count });
        }

        /// <summary>
        /// Reassigns multiple tasks to a new assignee in a single batch operation.
        /// </summary>
        [HttpPost("assign")]
        public async Task<IActionResult> BulkAssign([FromBody] BulkAssignDto dto)
        {
            if (dto.TaskIds == null || dto.TaskIds.Count == 0) return BadRequest(new { message = "No task IDs provided" });

            var assignee = await _context.Users.FindAsync(dto.AssignedToUserId);
            if (assignee == null) return BadRequest(new { message = "Target assignee not found" });

            var tasks = await _context.Tasks.Where(t => dto.TaskIds.Contains(t.Id) && !t.IsDeleted).ToListAsync();
            var now = DateTime.UtcNow;

            foreach (var task in tasks)
            {
                task.AssignedToUserId = dto.AssignedToUserId;
                task.LastUpdatedDate = now;
            }

            await _context.SaveChangesAsync();
            await _notificationService.CreateNotificationAsync(
                dto.AssignedToUserId,
                "Batch Tasks Assigned",
                $"You have been assigned {tasks.Count} new tasks in a batch reassignment.",
                "TaskAssigned",
                null
            );

            await _auditService.LogAsync("BulkAssign", "Tasks", null, null, $"Assigned {tasks.Count} tasks to user #{dto.AssignedToUserId}", CurrentUserId, ipAddress: ClientIp);

            return Ok(new { message = $"Successfully assigned {tasks.Count} tasks to {assignee.FullName}.", updatedCount = tasks.Count });
        }

        /// <summary>
        /// Updates the priority level for multiple tasks.
        /// </summary>
        [HttpPost("priority")]
        public async Task<IActionResult> BulkPriority([FromBody] BulkPriorityDto dto)
        {
            if (dto.TaskIds == null || dto.TaskIds.Count == 0) return BadRequest(new { message = "No task IDs provided" });

            var tasks = await _context.Tasks.Where(t => dto.TaskIds.Contains(t.Id) && !t.IsDeleted).ToListAsync();
            var now = DateTime.UtcNow;

            foreach (var task in tasks)
            {
                task.Priority = dto.NewPriority;
                task.LastUpdatedDate = now;
            }

            await _context.SaveChangesAsync();
            await _auditService.LogAsync("BulkPriority", "Tasks", null, null, $"Updated {tasks.Count} tasks to priority {dto.NewPriority}", CurrentUserId, ipAddress: ClientIp);

            return Ok(new { message = $"Successfully updated {tasks.Count} tasks priority.", updatedCount = tasks.Count });
        }

        /// <summary>
        /// Soft-deletes multiple tasks at once.
        /// </summary>
        [HttpPost("delete")]
        public async Task<IActionResult> BulkDelete([FromBody] BulkDeleteDto dto)
        {
            if (dto.TaskIds == null || dto.TaskIds.Count == 0) return BadRequest(new { message = "No task IDs provided" });

            var tasks = await _context.Tasks.Where(t => dto.TaskIds.Contains(t.Id) && !t.IsDeleted).ToListAsync();
            var now = DateTime.UtcNow;

            foreach (var task in tasks)
            {
                task.IsDeleted = true;
                task.LastUpdatedDate = now;
            }

            await _context.SaveChangesAsync();
            await _auditService.LogAsync("BulkDelete", "Tasks", null, null, $"Soft-deleted {tasks.Count} tasks", CurrentUserId, ipAddress: ClientIp);

            return Ok(new { message = $"Successfully deleted {tasks.Count} tasks.", deletedCount = tasks.Count });
        }
    }
}
