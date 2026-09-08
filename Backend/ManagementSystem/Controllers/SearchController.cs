using ManagementSystem.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ManagementSystem.Controllers
{
    public class GlobalSearchResultDto
    {
        public string Type { get; set; } = string.Empty; // "Task", "User", "Team"
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Subtitle { get; set; } = string.Empty;
        public string? Tag { get; set; }
        public string Url { get; set; } = string.Empty;
    }

    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class SearchController : ControllerBase
    {
        private readonly AppDbContext _context;

        public SearchController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> Search([FromQuery] string q)
        {
            if (string.IsNullOrWhiteSpace(q) || q.Trim().Length < 2)
            {
                return Ok(new List<GlobalSearchResultDto>());
            }

            var query = q.Trim().ToLower();
            var results = new List<GlobalSearchResultDto>();

            // 1. Search Tasks
            var tasks = await _context.Tasks
                .AsNoTracking()
                .Where(t => t.Title.ToLower().Contains(query) || (t.Description != null && t.Description.ToLower().Contains(query)) || (t.Tags != null && t.Tags.ToLower().Contains(query)))
                .Take(5)
                .Select(t => new GlobalSearchResultDto
                {
                    Type = "Task",
                    Id = t.Id,
                    Title = t.Title,
                    Subtitle = $"Status: {t.Status} | Priority: {t.Priority}",
                    Tag = t.Category ?? "Task",
                    Url = $"/tasks?taskId={t.Id}"
                }).ToListAsync();

            results.AddRange(tasks);

            // 2. Search Users
            var users = await _context.Users
                .AsNoTracking()
                .Where(u => u.FullName.ToLower().Contains(query) || u.Email.ToLower().Contains(query))
                .Take(4)
                .Select(u => new GlobalSearchResultDto
                {
                    Type = "User",
                    Id = u.Id,
                    Title = u.FullName,
                    Subtitle = $"{u.Email} ({u.Role})",
                    Tag = u.Role.ToString(),
                    Url = $"/users?userId={u.Id}"
                }).ToListAsync();

            results.AddRange(users);

            // 3. Search Teams
            var teams = await _context.Teams
                .AsNoTracking()
                .Where(t => t.Name.ToLower().Contains(query) || (t.Description != null && t.Description.ToLower().Contains(query)))
                .Take(4)
                .Select(t => new GlobalSearchResultDto
                {
                    Type = "Team",
                    Id = t.Id,
                    Title = t.Name,
                    Subtitle = t.Description ?? "Team Department",
                    Tag = "Team",
                    Url = $"/teams?teamId={t.Id}"
                }).ToListAsync();

            results.AddRange(teams);

            return Ok(results);
        }
    }
}
