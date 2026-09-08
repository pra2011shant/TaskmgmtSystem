using ManagementSystem.Data;
using ManagementSystem.Helpers;
using ManagementSystem.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ManagementSystem.Controllers
{
    public class UpdateRolePermissionsDto
    {
        public UserRole Role { get; set; }
        public List<string> GrantedPermissions { get; set; } = new List<string>();
    }

    [Authorize(Roles = "Admin")]
    [ApiController]
    [Route("api/[controller]")]
    public class AdminController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AdminController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("permissions")]
        public async Task<IActionResult> GetPermissionsMatrix()
        {
            var rolePermissions = await _context.RolePermissions.ToListAsync();
            var allPermissions = AppPermissions.All.ToList();

            var matrix = new Dictionary<string, List<string>>
            {
                ["Admin"] = allPermissions,
                ["Manager"] = rolePermissions.Where(rp => rp.Role == UserRole.Manager && rp.IsGranted).Select(rp => rp.Permission).ToList(),
                ["User"] = rolePermissions.Where(rp => rp.Role == UserRole.User && rp.IsGranted).Select(rp => rp.Permission).ToList()
            };

            // If empty in DB, provide defaults
            if (matrix["Manager"].Count == 0)
            {
                matrix["Manager"] = new List<string>
                {
                    AppPermissions.TaskCreate, AppPermissions.TaskView, AppPermissions.TaskEdit,
                    AppPermissions.TaskAssign, AppPermissions.TaskChangeStatus,
                    AppPermissions.TeamView, AppPermissions.TeamEdit, AppPermissions.TeamManageMembers,
                    AppPermissions.UserView, AppPermissions.ReportsExport
                };
            }

            if (matrix["User"].Count == 0)
            {
                matrix["User"] = new List<string>
                {
                    AppPermissions.TaskView, AppPermissions.TaskChangeStatus,
                    AppPermissions.TeamView, AppPermissions.UserView
                };
            }

            return Ok(new
            {
                allPermissions,
                rolePermissions = matrix
            });
        }

        [HttpPost("permissions")]
        public async Task<IActionResult> UpdateRolePermissions([FromBody] UpdateRolePermissionsDto dto)
        {
            if (dto.Role == UserRole.Admin)
            {
                return BadRequest(new { message = "Admin always possesses all permissions." });
            }

            var existing = await _context.RolePermissions.Where(rp => rp.Role == dto.Role).ToListAsync();
            _context.RolePermissions.RemoveRange(existing);

            foreach (var perm in dto.GrantedPermissions)
            {
                _context.RolePermissions.Add(new RolePermission
                {
                    Role = dto.Role,
                    Permission = perm,
                    IsGranted = true,
                    CreatedDate = DateTime.UtcNow
                });
            }

            await _context.SaveChangesAsync();
            return Ok(new { success = true, message = $"Permissions updated for role {dto.Role}." });
        }

        [HttpGet("system-stats")]
        public async Task<IActionResult> GetSystemStats()
        {
            var totalUsers = await _context.Users.CountAsync();
            var totalTeams = await _context.Teams.CountAsync();
            var totalTasks = await _context.Tasks.CountAsync();
            var totalComments = await _context.Comments.CountAsync();
            var totalAttachments = await _context.TaskAttachments.CountAsync();
            var totalAuditLogs = await _context.AuditLogs.CountAsync();

            return Ok(new
            {
                totalUsers,
                totalTeams,
                totalTasks,
                totalComments,
                totalAttachments,
                totalAuditLogs,
                serverTimeUtc = DateTime.UtcNow,
                frameworkVersion = ".NET 8.0",
                databaseEngine = "SQL Server / EF Core 8"
            });
        }
    }
}
