using System.Text.Json;
using ManagementSystem.Data;
using ManagementSystem.Models;
using Microsoft.EntityFrameworkCore;

namespace ManagementSystem.Services
{
    public class SystemActivityStatsDto
    {
        public int ActiveUsers { get; set; }
        public int TodayLogins { get; set; }
        public int TasksUpdatedToday { get; set; }
        public int DeletionsToday { get; set; }
        public int TotalAuditLogs { get; set; }
    }

    public class UserPresenceDto
    {
        public int Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public string? Department { get; set; }
        public bool IsOnline { get; set; }
        public DateTime? LoginTime { get; set; }
        public DateTime? LastActivity { get; set; }
        public DateTime? LastLogout { get; set; }
        public string? LastIpAddress { get; set; }
        public string? LastUserAgent { get; set; }
    }

    public class TaskViewDto
    {
        public int UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string? UserRole { get; set; }
        public DateTime ViewedAt { get; set; }
    }

    public interface IAuditService
    {
        Task LogAsync(string action, string entityName, string? entityId, object? oldValue, object? newValue, int? userId = null, string? userName = null, string? userRole = null, string? ipAddress = null, string? module = null, string? description = null, string? userAgent = null);
        Task<IEnumerable<AuditLog>> GetLogsAsync(string? search = null, string? entityName = null, string? module = null, string? action = null, int? userId = null, DateTime? fromDate = null, DateTime? toDate = null, int limit = 100);
        Task<SystemActivityStatsDto> GetActivityStatsAsync();
        Task<List<UserPresenceDto>> GetUserPresenceListAsync();
        Task RecordTaskViewAsync(int taskId, int userId, string userName, string? userRole = null, string? ipAddress = null);
        Task<List<TaskViewDto>> GetTaskViewsAsync(int taskId);
        Task UpdateUserPresenceAsync(int userId, bool isOnline, string? ipAddress = null, string? userAgent = null, bool isLogin = false, bool isLogout = false);
    }

    public class AuditService : IAuditService
    {
        private readonly AppDbContext _context;
        private readonly ILogger<AuditService> _logger;

        public AuditService(AppDbContext context, ILogger<AuditService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task LogAsync(string action, string entityName, string? entityId, object? oldValue, object? newValue, int? userId = null, string? userName = null, string? userRole = null, string? ipAddress = null, string? module = null, string? description = null, string? userAgent = null)
        {
            try
            {
                var auditLog = new AuditLog
                {
                    Action = action,
                    Module = module ?? entityName,
                    EntityName = entityName,
                    EntityId = entityId,
                    Description = description ?? $"{action} performed on {entityName} #{entityId}",
                    OldValueJson = oldValue != null ? (oldValue is string strOld ? strOld : JsonSerializer.Serialize(oldValue)) : null,
                    NewValueJson = newValue != null ? (newValue is string strNew ? strNew : JsonSerializer.Serialize(newValue)) : null,
                    UserId = userId,
                    UserName = userName,
                    UserRole = userRole,
                    IpAddress = ipAddress,
                    UserAgent = userAgent,
                    Timestamp = DateTime.UtcNow
                };

                _context.AuditLogs.Add(auditLog);
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to persist audit log for Action: {Action}, Entity: {EntityName}", action, entityName);
            }
        }

        public async Task<IEnumerable<AuditLog>> GetLogsAsync(string? search = null, string? entityName = null, string? module = null, string? action = null, int? userId = null, DateTime? fromDate = null, DateTime? toDate = null, int limit = 100)
        {
            var query = _context.AuditLogs.AsNoTracking().AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.Trim().ToLower();
                query = query.Where(a => 
                    (a.UserName != null && a.UserName.ToLower().Contains(term)) ||
                    a.Action.ToLower().Contains(term) ||
                    a.EntityName.ToLower().Contains(term) ||
                    (a.EntityId != null && a.EntityId.Contains(term)) ||
                    (a.Description != null && a.Description.ToLower().Contains(term))
                );
            }

            if (!string.IsNullOrWhiteSpace(entityName))
                query = query.Where(a => a.EntityName == entityName);

            if (!string.IsNullOrWhiteSpace(module))
                query = query.Where(a => a.Module == module || a.EntityName == module);

            if (!string.IsNullOrWhiteSpace(action))
                query = query.Where(a => a.Action.ToUpper() == action.ToUpper());

            if (userId.HasValue)
                query = query.Where(a => a.UserId == userId.Value);

            if (fromDate.HasValue)
                query = query.Where(a => a.Timestamp >= fromDate.Value);

            if (toDate.HasValue)
                query = query.Where(a => a.Timestamp <= toDate.Value);

            return await query.OrderByDescending(a => a.Timestamp).Take(limit).ToListAsync();
        }

        public async Task<SystemActivityStatsDto> GetActivityStatsAsync()
        {
            var todayUtc = DateTime.UtcNow.Date;

            var activeUsers = await _context.Users.CountAsync(u => u.IsOnline || (u.LastActivityDate.HasValue && u.LastActivityDate >= DateTime.UtcNow.AddMinutes(-30)));
            var todayLogins = await _context.AuditLogs.CountAsync(a => a.Action == "LOGIN" && a.Timestamp >= todayUtc);
            var tasksUpdated = await _context.AuditLogs.CountAsync(a => a.EntityName == "Task" && (a.Action == "UPDATE" || a.Action == "STATUS_CHANGE" || a.Action == "ASSIGN") && a.Timestamp >= todayUtc);
            var deletions = await _context.AuditLogs.CountAsync(a => a.Action == "DELETE" && a.Timestamp >= todayUtc);
            var totalLogs = await _context.AuditLogs.CountAsync();

            return new SystemActivityStatsDto
            {
                ActiveUsers = activeUsers,
                TodayLogins = todayLogins,
                TasksUpdatedToday = tasksUpdated,
                DeletionsToday = deletions,
                TotalAuditLogs = totalLogs
            };
        }

        public async Task<List<UserPresenceDto>> GetUserPresenceListAsync()
        {
            var users = await _context.Users.AsNoTracking().ToListAsync();

            return users.Select(u => new UserPresenceDto
            {
                Id = u.Id,
                FullName = u.FullName,
                Email = u.Email,
                Role = u.Role.ToString(),
                Department = u.Department,
                IsOnline = u.IsOnline || (u.LastActivityDate.HasValue && u.LastActivityDate >= DateTime.UtcNow.AddMinutes(-15)),
                LoginTime = u.LastLoginDate,
                LastActivity = u.LastActivityDate ?? u.LastLoginDate,
                LastLogout = u.LastLogoutDate,
                LastIpAddress = u.LastIpAddress,
                LastUserAgent = u.LastUserAgent
            }).OrderByDescending(u => u.IsOnline).ThenBy(u => u.FullName).ToList();
        }

        public async Task RecordTaskViewAsync(int taskId, int userId, string userName, string? userRole = null, string? ipAddress = null)
        {
            try
            {
                var existingView = await _context.TaskViews
                    .FirstOrDefaultAsync(tv => tv.TaskId == taskId && tv.UserId == userId);

                if (existingView != null)
                {
                    existingView.ViewedAt = DateTime.UtcNow;
                    existingView.IpAddress = ipAddress;
                }
                else
                {
                    _context.TaskViews.Add(new TaskView
                    {
                        TaskId = taskId,
                        UserId = userId,
                        UserName = userName,
                        UserRole = userRole,
                        IpAddress = ipAddress,
                        ViewedAt = DateTime.UtcNow
                    });
                }

                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error recording task view for TaskId: {TaskId}, UserId: {UserId}", taskId, userId);
            }
        }

        public async Task<List<TaskViewDto>> GetTaskViewsAsync(int taskId)
        {
            return await _context.TaskViews.AsNoTracking()
                .Where(tv => tv.TaskId == taskId)
                .OrderByDescending(tv => tv.ViewedAt)
                .Select(tv => new TaskViewDto
                {
                    UserId = tv.UserId,
                    UserName = tv.UserName ?? "User",
                    UserRole = tv.UserRole,
                    ViewedAt = tv.ViewedAt
                })
                .ToListAsync();
        }

        public async Task UpdateUserPresenceAsync(int userId, bool isOnline, string? ipAddress = null, string? userAgent = null, bool isLogin = false, bool isLogout = false)
        {
            try
            {
                var user = await _context.Users.FindAsync(userId);
                if (user != null)
                {
                    user.IsOnline = isOnline;
                    user.LastActivityDate = DateTime.UtcNow;

                    if (isLogin)
                        user.LastLoginDate = DateTime.UtcNow;

                    if (isLogout)
                        user.LastLogoutDate = DateTime.UtcNow;

                    if (!string.IsNullOrEmpty(ipAddress))
                        user.LastIpAddress = ipAddress;

                    if (!string.IsNullOrEmpty(userAgent))
                        user.LastUserAgent = userAgent;

                    await _context.SaveChangesAsync();
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating user presence for UserId: {UserId}", userId);
            }
        }
    }
}
