using System.Security.Claims;
using ManagementSystem.DTOs;
using ManagementSystem.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ManagementSystem.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class ReportsController : ControllerBase
    {
        private readonly IReportService _reportService;

        public ReportsController(IReportService reportService)
        {
            _reportService = reportService;
        }

        private (int UserId, string Role) GetUserInfo()
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            int.TryParse(userIdClaim, out var userId);
            var role = User.FindFirstValue(ClaimTypes.Role) ?? "User";
            return (userId, role);
        }

        [HttpGet("user-productivity")]
        public async Task<IActionResult> GetUserProductivity()
        {
            var data = await _reportService.GetUserProductivityReportAsync();
            return Ok(data);
        }

        [HttpGet("team-productivity")]
        public async Task<IActionResult> GetTeamProductivity()
        {
            var data = await _reportService.GetTeamProductivityReportAsync();
            return Ok(data);
        }

        [HttpGet("overdue-tasks")]
        public async Task<IActionResult> GetOverdueTasks()
        {
            var data = await _reportService.GetOverdueTasksReportAsync();
            return Ok(data);
        }

        [HttpGet("export/csv")]
        public async Task<IActionResult> ExportCsv([FromQuery] TaskFilterDto filter)
        {
            var (userId, role) = GetUserInfo();
            var bytes = await _reportService.GenerateTasksCsvAsync(filter, userId, role);
            return File(bytes, "text/csv", $"Tasks_Export_{DateTime.UtcNow:yyyyMMddHHmmss}.csv");
        }

        [HttpGet("export/html")]
        public async Task<IActionResult> ExportHtml([FromQuery] string type = "user")
        {
            var (userId, role) = GetUserInfo();
            var bytes = await _reportService.GenerateHtmlReportAsync(type, userId, role);
            return File(bytes, "text/html", $"{type}_report_{DateTime.UtcNow:yyyyMMdd}.html");
        }
    }
}
