using System.Text;
using ManagementSystem.Data;
using ManagementSystem.DTOs;
using ManagementSystem.Models;
using Microsoft.EntityFrameworkCore;

namespace ManagementSystem.Services
{
    public class UserProductivityDto
    {
        public int UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string UserEmail { get; set; } = string.Empty;
        public int TotalAssigned { get; set; }
        public int Completed { get; set; }
        public int InProgress { get; set; }
        public int Overdue { get; set; }
        public double CompletionRate { get; set; }
        public double TotalEstimatedHours { get; set; }
        public double TotalActualHours { get; set; }
    }

    public class TeamProductivityDto
    {
        public int TeamId { get; set; }
        public string TeamName { get; set; } = string.Empty;
        public string ManagerName { get; set; } = string.Empty;
        public int MemberCount { get; set; }
        public int TotalTasks { get; set; }
        public int CompletedTasks { get; set; }
        public int OverdueTasks { get; set; }
        public double CompletionRate { get; set; }
    }

    public interface IReportService
    {
        Task<List<UserProductivityDto>> GetUserProductivityReportAsync();
        Task<List<TeamProductivityDto>> GetTeamProductivityReportAsync();
        Task<List<TaskDto>> GetOverdueTasksReportAsync();
        Task<byte[]> GenerateTasksCsvAsync(TaskFilterDto filter, int userId, string role);
        Task<byte[]> GenerateHtmlReportAsync(string reportType, int userId, string role);
    }

    public class ReportService : IReportService
    {
        private readonly AppDbContext _context;
        private readonly ITaskService _taskService;

        public ReportService(AppDbContext context, ITaskService taskService)
        {
            _context = context;
            _taskService = taskService;
        }

        public async Task<List<UserProductivityDto>> GetUserProductivityReportAsync()
        {
            var users = await _context.Users
                .Include(u => u.AssignedTasks)
                .AsNoTracking()
                .ToListAsync();

            var result = new List<UserProductivityDto>();

            foreach (var user in users)
            {
                var tasks = user.AssignedTasks.Where(t => !t.IsDeleted).ToList();
                var total = tasks.Count;
                var completed = tasks.Count(t => t.Status == TaskStatusEnum.Done);
                var inProgress = tasks.Count(t => t.Status == TaskStatusEnum.InProgress);
                var overdue = tasks.Count(t => t.DueDate.HasValue && t.DueDate.Value < DateTime.UtcNow && t.Status != TaskStatusEnum.Done);
                var estHours = tasks.Sum(t => t.EstimatedHours ?? 0);
                var actHours = tasks.Sum(t => t.ActualHours ?? 0);

                result.Add(new UserProductivityDto
                {
                    UserId = user.Id,
                    UserName = user.FullName,
                    UserEmail = user.Email,
                    TotalAssigned = total,
                    Completed = completed,
                    InProgress = inProgress,
                    Overdue = overdue,
                    CompletionRate = total > 0 ? Math.Round((double)completed / total * 100, 1) : 0,
                    TotalEstimatedHours = estHours,
                    TotalActualHours = actHours
                });
            }

            return result.OrderByDescending(r => r.TotalAssigned).ToList();
        }

        public async Task<List<TeamProductivityDto>> GetTeamProductivityReportAsync()
        {
            var teams = await _context.Teams
                .Include(t => t.Manager)
                .Include(t => t.Members)
                .Include(t => t.Tasks)
                .AsNoTracking()
                .ToListAsync();

            var result = new List<TeamProductivityDto>();

            foreach (var team in teams)
            {
                var tasks = team.Tasks.Where(t => !t.IsDeleted).ToList();
                var total = tasks.Count;
                var completed = tasks.Count(t => t.Status == TaskStatusEnum.Done);
                var overdue = tasks.Count(t => t.DueDate.HasValue && t.DueDate.Value < DateTime.UtcNow && t.Status != TaskStatusEnum.Done);

                result.Add(new TeamProductivityDto
                {
                    TeamId = team.Id,
                    TeamName = team.Name,
                    ManagerName = team.Manager?.FullName ?? "Unassigned",
                    MemberCount = team.Members.Count,
                    TotalTasks = total,
                    CompletedTasks = completed,
                    OverdueTasks = overdue,
                    CompletionRate = total > 0 ? Math.Round((double)completed / total * 100, 1) : 0
                });
            }

            return result.OrderByDescending(r => r.TotalTasks).ToList();
        }

        public async Task<List<TaskDto>> GetOverdueTasksReportAsync()
        {
            var overdueFilter = new TaskFilterDto
            {
                IsOverdue = true,
                PageSize = 200
            };

            return await _taskService.GetTasksAsync(overdueFilter, 1, "Admin");
        }

        public async Task<byte[]> GenerateTasksCsvAsync(TaskFilterDto filter, int userId, string role)
        {
            filter.PageSize = 1000;
            var tasks = await _taskService.GetTasksAsync(filter, userId, role);

            var sb = new StringBuilder();
            sb.AppendLine("Id,Title,Status,Priority,Category,Tags,Assignee,Team,EstimatedHours,ActualHours,DueDate,CreatedAt");

            foreach (var task in tasks)
            {
                var title = EscapeCsv(task.Title);
                var category = EscapeCsv(task.Category);
                var tags = EscapeCsv(task.Tags ?? "");
                var assignee = EscapeCsv(task.AssignedToUserName ?? "Unassigned");
                var team = EscapeCsv(task.TeamName ?? "None");
                var dueDate = task.DueDate.HasValue ? task.DueDate.Value.ToString("yyyy-MM-dd") : "";
                var createdAt = task.CreatedAt.ToString("yyyy-MM-dd HH:mm");

                sb.AppendLine($"{task.Id},{title},{task.Status},{task.Priority},{category},{tags},{assignee},{team},{task.EstimatedHours},{task.ActualHours},{dueDate},{createdAt}");
            }

            return Encoding.UTF8.GetBytes(sb.ToString());
        }

        public async Task<byte[]> GenerateHtmlReportAsync(string reportType, int userId, string role)
        {
            var sb = new StringBuilder();
            sb.AppendLine("<!DOCTYPE html><html><head><meta charset='utf-8'><title>WorkFlow Pro Report</title>");
            sb.AppendLine("<style>body{font-family:Segoe UI,Roboto,sans-serif;margin:40px;color:#1e293b;} table{width:100%;border-collapse:collapse;margin-top:20px;} th,td{border:1px solid #cbd5e1;padding:10px 12px;text-align:left;} th{background:#0f172a;color:#ffffff;} tr:nth-child(even){background:#f8fafc;} h1{color:#0f172a;margin-bottom:4px;} .meta{color:#64748b;font-size:14px;margin-bottom:24px;}</style>");
            sb.AppendLine("</head><body>");

            if (reportType.ToLower() == "team")
            {
                var teamData = await GetTeamProductivityReportAsync();
                sb.AppendLine("<h1>Team Productivity & Delivery Report</h1>");
                sb.AppendLine($"<div class='meta'>Generated on {DateTime.UtcNow:MMMM dd, yyyy HH:mm} UTC | WorkFlow Pro Enterprise</div>");
                sb.AppendLine("<table><thead><tr><th>Team Name</th><th>Manager</th><th>Members</th><th>Total Tasks</th><th>Completed</th><th>Overdue</th><th>Completion Rate</th></tr></thead><tbody>");
                foreach (var t in teamData)
                {
                    sb.AppendLine($"<tr><td><strong>{t.TeamName}</strong></td><td>{t.ManagerName}</td><td>{t.MemberCount}</td><td>{t.TotalTasks}</td><td>{t.CompletedTasks}</td><td>{t.OverdueTasks}</td><td>{t.CompletionRate}%</td></tr>");
                }
                sb.AppendLine("</tbody></table>");
            }
            else
            {
                var userData = await GetUserProductivityReportAsync();
                sb.AppendLine("<h1>User Productivity & SLA Telemetry Report</h1>");
                sb.AppendLine($"<div class='meta'>Generated on {DateTime.UtcNow:MMMM dd, yyyy HH:mm} UTC | WorkFlow Pro Enterprise</div>");
                sb.AppendLine("<table><thead><tr><th>Employee Name</th><th>Email</th><th>Assigned</th><th>Completed</th><th>In Progress</th><th>Overdue</th><th>Rate</th><th>Est Hours</th><th>Act Hours</th></tr></thead><tbody>");
                foreach (var u in userData)
                {
                    sb.AppendLine($"<tr><td><strong>{u.UserName}</strong></td><td>{u.UserEmail}</td><td>{u.TotalAssigned}</td><td>{u.Completed}</td><td>{u.InProgress}</td><td>{u.Overdue}</td><td>{u.CompletionRate}%</td><td>{u.TotalEstimatedHours}</td><td>{u.TotalActualHours}</td></tr>");
                }
                sb.AppendLine("</tbody></table>");
            }

            sb.AppendLine("</body></html>");
            return Encoding.UTF8.GetBytes(sb.ToString());
        }

        private static string EscapeCsv(string field)
        {
            if (string.IsNullOrEmpty(field)) return "";
            if (field.Contains(',') || field.Contains('"') || field.Contains('\n'))
            {
                return $"\"{field.Replace("\"", "\"\"")}\"";
            }
            return field;
        }
    }
}
