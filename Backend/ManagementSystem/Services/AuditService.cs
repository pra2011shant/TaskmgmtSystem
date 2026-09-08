using System.Text.Json;
using ManagementSystem.Data;
using ManagementSystem.Models;
using Microsoft.EntityFrameworkCore;

namespace ManagementSystem.Services
{
    public interface IAuditService
    {
        Task LogAsync(string action, string entityName, string? entityId, object? oldValue, object? newValue, int? userId = null, string? userName = null, string? userRole = null, string? ipAddress = null);
        Task<IEnumerable<AuditLog>> GetLogsAsync(string? entityName = null, string? entityId = null, int? userId = null, string? action = null, int limit = 100);
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

        public async Task LogAsync(string action, string entityName, string? entityId, object? oldValue, object? newValue, int? userId = null, string? userName = null, string? userRole = null, string? ipAddress = null)
        {
            try
            {
                var auditLog = new AuditLog
                {
                    Action = action,
                    EntityName = entityName,
                    EntityId = entityId,
                    OldValueJson = oldValue != null ? (oldValue is string strOld ? strOld : JsonSerializer.Serialize(oldValue)) : null,
                    NewValueJson = newValue != null ? (newValue is string strNew ? strNew : JsonSerializer.Serialize(newValue)) : null,
                    UserId = userId,
                    UserName = userName,
                    UserRole = userRole,
                    IpAddress = ipAddress,
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

        public async Task<IEnumerable<AuditLog>> GetLogsAsync(string? entityName = null, string? entityId = null, int? userId = null, string? action = null, int limit = 100)
        {
            var query = _context.AuditLogs.AsNoTracking().AsQueryable();

            if (!string.IsNullOrWhiteSpace(entityName))
                query = query.Where(a => a.EntityName == entityName);

            if (!string.IsNullOrWhiteSpace(entityId))
                query = query.Where(a => a.EntityId == entityId);

            if (userId.HasValue)
                query = query.Where(a => a.UserId == userId.Value);

            if (!string.IsNullOrWhiteSpace(action))
                query = query.Where(a => a.Action.Contains(action));

            return await query.OrderByDescending(a => a.Timestamp).Take(limit).ToListAsync();
        }
    }
}
