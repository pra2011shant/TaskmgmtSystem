using System.Security.Claims;
using ManagementSystem.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ManagementSystem.Controllers
{
    /// <summary>
    /// RESTful API Controller serving real-time organizational KPIs, throughput metrics, and workload distributions.
    /// </summary>
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class DashboardController : ControllerBase
    {
        private readonly ITaskService _taskService;

        public DashboardController(ITaskService taskService)
        {
            _taskService = taskService;
        }

        private int CurrentUserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        private string CurrentUserRole => User.FindFirstValue(ClaimTypes.Role) ?? "User";

        /// <summary>
        /// Retrieves aggregated metrics, task status counters, and workload distribution for dashboard visualization (GET /api/dashboard/stats).
        /// </summary>
        [HttpGet("stats")]
        public async Task<IActionResult> GetDashboardStats()
        {
            var summary = await _taskService.GetDashboardSummaryAsync(CurrentUserId, CurrentUserRole);
            return Ok(summary);
        }
    }
}
