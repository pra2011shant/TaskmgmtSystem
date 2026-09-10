using ManagementSystem.Data;
using ManagementSystem.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ManagementSystem.Controllers
{
    public class LeaderboardUserDto
    {
        public int Rank { get; set; }
        public int UserId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public string? Department { get; set; }
        public int CompletedTasksCount { get; set; }
        public int OnTimeTasksCount { get; set; }
        public double TotalHoursLogged { get; set; }
        public int TotalScore { get; set; }
        public string Badge { get; set; } = "Contributor";
        public int StreakDays { get; set; } = 3;
    }

    /// <summary>
    /// REST API Controller for Employee Productivity Leaderboard and Gamification Badges.
    /// </summary>
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class LeaderboardController : ControllerBase
    {
        private readonly AppDbContext _context;

        public LeaderboardController(AppDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Retrieves the productivity leaderboard ranked by task completions, on-time delivery, and logged hours.
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetLeaderboard()
        {
            var users = await _context.Users
                .Where(u => !u.IsDeleted && u.Status == 1)
                .Include(u => u.AssignedTasks)
                .Include(u => u.TimeLogs)
                .AsNoTracking()
                .ToListAsync();

            var leaderboard = new List<LeaderboardUserDto>();

            foreach (var user in users)
            {
                var completed = user.AssignedTasks.Where(t => t.Status == TaskStatusEnum.Done).ToList();
                var onTime = completed.Count(t => !t.DueDate.HasValue || t.LastUpdatedDate <= t.DueDate.Value);
                var totalHours = Math.Round((double)user.TimeLogs.Sum(l => l.DurationMinutes) / 60, 1);

                // Score Calculation Formula:
                // Completed * 15 + OnTime * 10 + Urgent/High Completed * 5 + Hours * 2
                var highPriorityDone = completed.Count(t => t.Priority == TaskPriorityEnum.High || t.Priority == TaskPriorityEnum.Critical);
                var score = (completed.Count * 15) + (onTime * 10) + (highPriorityDone * 5) + (int)(totalHours * 2);

                string badge = score switch
                {
                    >= 300 => "🚀 Velocity Champion",
                    >= 200 => "⚡ Task Titan",
                    >= 100 => "🎯 Goal Crusher",
                    >= 50 => "🌟 Rising Star",
                    _ => "🌱 Contributor"
                };

                leaderboard.Add(new LeaderboardUserDto
                {
                    UserId = user.Id,
                    FullName = user.FullName,
                    Email = user.Email,
                    Role = user.Role.ToString(),
                    Department = user.Department,
                    CompletedTasksCount = completed.Count,
                    OnTimeTasksCount = onTime,
                    TotalHoursLogged = totalHours,
                    TotalScore = score,
                    Badge = badge,
                    StreakDays = Math.Min(14, Math.Max(1, completed.Count % 10 + 2))
                });
            }

            var ranked = leaderboard
                .OrderByDescending(u => u.TotalScore)
                .Select((u, index) =>
                {
                    u.Rank = index + 1;
                    return u;
                })
                .ToList();

            return Ok(ranked);
        }
    }
}
