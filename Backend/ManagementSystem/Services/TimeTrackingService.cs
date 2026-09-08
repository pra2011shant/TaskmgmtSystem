using ManagementSystem.Data;
using ManagementSystem.Models;
using Microsoft.EntityFrameworkCore;

namespace ManagementSystem.Services
{
    public class TimeLogDto
    {
        public int Id { get; set; }
        public int TaskId { get; set; }
        public string? TaskTitle { get; set; }
        public int UserId { get; set; }
        public string? UserName { get; set; }
        public DateTime StartTime { get; set; }
        public DateTime? EndTime { get; set; }
        public int DurationMinutes { get; set; }
        public string? Description { get; set; }
        public bool IsRunning => EndTime == null;
    }

    public class StartTimerDto
    {
        public int TaskId { get; set; }
        public string? Description { get; set; }
    }

    public class ManualTimeLogDto
    {
        public int TaskId { get; set; }
        public int DurationMinutes { get; set; }
        public string? Description { get; set; }
        public DateTime? LogDate { get; set; }
    }

    public interface ITimeTrackingService
    {
        Task<TimeLogDto?> GetActiveTimerAsync(int userId);
        Task<(bool Success, string Message, TimeLogDto? Data)> StartTimerAsync(int taskId, int userId, string? description);
        Task<(bool Success, string Message, TimeLogDto? Data)> StopTimerAsync(int taskId, int userId);
        Task<(bool Success, string Message, TimeLogDto? Data)> LogManualTimeAsync(int userId, ManualTimeLogDto dto);
        Task<List<TimeLogDto>> GetTaskTimeLogsAsync(int taskId);
        Task<List<TimeLogDto>> GetUserTimeLogsAsync(int userId, DateTime? fromDate, DateTime? toDate);
    }

    public class TimeTrackingService : ITimeTrackingService
    {
        private readonly AppDbContext _context;
        private readonly ILogger<TimeTrackingService> _logger;

        public TimeTrackingService(AppDbContext context, ILogger<TimeTrackingService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<TimeLogDto?> GetActiveTimerAsync(int userId)
        {
            var log = await _context.TaskTimeLogs
                .Include(l => l.Task)
                .Include(l => l.User)
                .Where(l => l.UserId == userId && l.EndTime == null)
                .OrderByDescending(l => l.StartTime)
                .FirstOrDefaultAsync();

            return log == null ? null : MapToDto(log);
        }

        public async Task<(bool Success, string Message, TimeLogDto? Data)> StartTimerAsync(int taskId, int userId, string? description)
        {
            try
            {
                var task = await _context.Tasks.FindAsync(taskId);
                if (task == null || task.IsDeleted)
                {
                    return (false, "Task not found.", null);
                }

                // Check if user already has an active timer; stop it first
                var active = await _context.TaskTimeLogs
                    .Where(l => l.UserId == userId && l.EndTime == null)
                    .ToListAsync();

                var now = DateTime.UtcNow;
                foreach (var running in active)
                {
                    running.EndTime = now;
                    var mins = (int)(now - running.StartTime).TotalMinutes;
                    running.DurationMinutes = Math.Max(1, mins);
                }

                var newLog = new TaskTimeLog
                {
                    TaskId = taskId,
                    UserId = userId,
                    StartTime = now,
                    Description = description?.Trim(),
                    CreatedDate = now
                };

                _context.TaskTimeLogs.Add(newLog);

                // Update task status to InProgress if it was ToDo
                if (task.Status == TaskStatusEnum.ToDo || task.Status == TaskStatusEnum.Created)
                {
                    task.Status = TaskStatusEnum.InProgress;
                    task.LastUpdatedDate = now;
                }

                await _context.SaveChangesAsync();

                var loaded = await _context.TaskTimeLogs
                    .Include(l => l.Task)
                    .Include(l => l.User)
                    .FirstAsync(l => l.Id == newLog.Id);

                return (true, "Timer started successfully.", MapToDto(loaded));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to start timer");
                return (false, "Error starting timer.", null);
            }
        }

        public async Task<(bool Success, string Message, TimeLogDto? Data)> StopTimerAsync(int taskId, int userId)
        {
            try
            {
                var running = await _context.TaskTimeLogs
                    .Include(l => l.Task)
                    .Include(l => l.User)
                    .Where(l => l.TaskId == taskId && l.UserId == userId && l.EndTime == null)
                    .OrderByDescending(l => l.StartTime)
                    .FirstOrDefaultAsync();

                if (running == null)
                {
                    return (false, "No active timer session found for this task.", null);
                }

                var now = DateTime.UtcNow;
                running.EndTime = now;
                var mins = (int)(now - running.StartTime).TotalMinutes;
                running.DurationMinutes = Math.Max(1, mins);

                // Add to task's actual hours
                var task = await _context.Tasks.FindAsync(taskId);
                if (task != null)
                {
                    task.ActualHours = (task.ActualHours ?? 0) + Math.Round((double)running.DurationMinutes / 60, 2);
                    task.LastUpdatedDate = now;
                }

                await _context.SaveChangesAsync();
                return (true, "Timer stopped successfully.", MapToDto(running));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to stop timer");
                return (false, "Error stopping timer.", null);
            }
        }

        public async Task<(bool Success, string Message, TimeLogDto? Data)> LogManualTimeAsync(int userId, ManualTimeLogDto dto)
        {
            try
            {
                var task = await _context.Tasks.FindAsync(dto.TaskId);
                if (task == null || task.IsDeleted) return (false, "Task not found.", null);

                var logDate = dto.LogDate ?? DateTime.UtcNow;
                var log = new TaskTimeLog
                {
                    TaskId = dto.TaskId,
                    UserId = userId,
                    StartTime = logDate.AddMinutes(-dto.DurationMinutes),
                    EndTime = logDate,
                    DurationMinutes = dto.DurationMinutes,
                    Description = dto.Description?.Trim(),
                    CreatedDate = DateTime.UtcNow
                };

                _context.TaskTimeLogs.Add(log);
                task.ActualHours = (task.ActualHours ?? 0) + Math.Round((double)dto.DurationMinutes / 60, 2);
                task.LastUpdatedDate = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                var loaded = await _context.TaskTimeLogs
                    .Include(l => l.Task)
                    .Include(l => l.User)
                    .FirstAsync(l => l.Id == log.Id);

                return (true, "Manual time log saved.", MapToDto(loaded));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to log manual time");
                return (false, "Error saving manual time log.", null);
            }
        }

        public async Task<List<TimeLogDto>> GetTaskTimeLogsAsync(int taskId)
        {
            var logs = await _context.TaskTimeLogs
                .Include(l => l.Task)
                .Include(l => l.User)
                .Where(l => l.TaskId == taskId)
                .OrderByDescending(l => l.StartTime)
                .AsNoTracking()
                .ToListAsync();

            return logs.Select(MapToDto).ToList();
        }

        public async Task<List<TimeLogDto>> GetUserTimeLogsAsync(int userId, DateTime? fromDate, DateTime? toDate)
        {
            var query = _context.TaskTimeLogs
                .Include(l => l.Task)
                .Include(l => l.User)
                .Where(l => l.UserId == userId);

            if (fromDate.HasValue) query = query.Where(l => l.StartTime >= fromDate.Value);
            if (toDate.HasValue) query = query.Where(l => l.StartTime <= toDate.Value);

            var logs = await query.OrderByDescending(l => l.StartTime).AsNoTracking().ToListAsync();
            return logs.Select(MapToDto).ToList();
        }

        private static TimeLogDto MapToDto(TaskTimeLog l) => new()
        {
            Id = l.Id,
            TaskId = l.TaskId,
            TaskTitle = l.Task?.Title,
            UserId = l.UserId,
            UserName = l.User?.FullName,
            StartTime = l.StartTime,
            EndTime = l.EndTime,
            DurationMinutes = l.DurationMinutes,
            Description = l.Description
        };
    }
}
