using System.Security.Claims;
using ManagementSystem.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ManagementSystem.Controllers
{
    /// <summary>
    /// REST API Controller for Managing Task Stopwatch Sessions and Work Time Logs.
    /// </summary>
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class TimeTrackingController : ControllerBase
    {
        private readonly ITimeTrackingService _timeTrackingService;

        public TimeTrackingController(ITimeTrackingService timeTrackingService)
        {
            _timeTrackingService = timeTrackingService;
        }

        private int CurrentUserId => int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : 1;

        /// <summary>
        /// Gets the current running timer session for the logged-in user.
        /// </summary>
        [HttpGet("active")]
        public async Task<IActionResult> GetActiveTimer()
        {
            var timer = await _timeTrackingService.GetActiveTimerAsync(CurrentUserId);
            return Ok(timer);
        }

        /// <summary>
        /// Starts a live stopwatch timer session on a specific task.
        /// </summary>
        [HttpPost("start")]
        public async Task<IActionResult> StartTimer([FromBody] StartTimerDto dto)
        {
            var (success, message, data) = await _timeTrackingService.StartTimerAsync(dto.TaskId, CurrentUserId, dto.Description);
            if (!success) return BadRequest(new { message });
            return Ok(data);
        }

        /// <summary>
        /// Stops the active timer session on a task and updates actual hours.
        /// </summary>
        [HttpPost("stop/{taskId}")]
        public async Task<IActionResult> StopTimer(int taskId)
        {
            var (success, message, data) = await _timeTrackingService.StopTimerAsync(taskId, CurrentUserId);
            if (!success) return BadRequest(new { message });
            return Ok(data);
        }

        /// <summary>
        /// Logs a manual duration entry for a task.
        /// </summary>
        [HttpPost("manual")]
        public async Task<IActionResult> LogManual([FromBody] ManualTimeLogDto dto)
        {
            var (success, message, data) = await _timeTrackingService.LogManualTimeAsync(CurrentUserId, dto);
            if (!success) return BadRequest(new { message });
            return Ok(data);
        }

        /// <summary>
        /// Retrieves all logged time entries for a given task.
        /// </summary>
        [HttpGet("task/{taskId}")]
        public async Task<IActionResult> GetTaskLogs(int taskId)
        {
            var logs = await _timeTrackingService.GetTaskTimeLogsAsync(taskId);
            return Ok(logs);
        }

        /// <summary>
        /// Retrieves current user's time tracking history.
        /// </summary>
        [HttpGet("my-logs")]
        public async Task<IActionResult> GetMyLogs([FromQuery] DateTime? fromDate, [FromQuery] DateTime? toDate)
        {
            var logs = await _timeTrackingService.GetUserTimeLogsAsync(CurrentUserId, fromDate, toDate);
            return Ok(logs);
        }
    }
}
