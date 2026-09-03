using ManagementSystem.Data;
using ManagementSystem.DTOs;
using ManagementSystem.Models;
using Microsoft.EntityFrameworkCore;

namespace ManagementSystem.Services
{
    /// <summary>
    /// Service contract defining operations for in-app alert dispatch, inbox retrieval, and acknowledgement tracking.
    /// </summary>
    public interface INotificationService
    {
        /// <summary>
        /// Dispatches an asynchronous in-app notification event to the specified user.
        /// </summary>
        Task CreateNotificationAsync(int userId, string title, string message, string type, int? relatedTaskId = null);

        /// <summary>
        /// Retrieves the most recent notifications for a user in reverse chronological order.
        /// </summary>
        Task<List<NotificationDto>> GetUserNotificationsAsync(int userId);

        /// <summary>
        /// Calculates total unacknowledged alerts for unread badge counters.
        /// </summary>
        Task<int> GetUnreadCountAsync(int userId);

        /// <summary>
        /// Marks an individual notification as read.
        /// </summary>
        Task<bool> MarkAsReadAsync(int notificationId, int userId);

        /// <summary>
        /// Acknowledges all pending unread notifications for a user.
        /// </summary>
        Task<bool> MarkAllAsReadAsync(int userId);
    }

    /// <summary>
    /// Implementation of notification management with asynchronous event dispatch and read state tracking.
    /// </summary>
    public class NotificationService : INotificationService
    {
        private readonly AppDbContext _context;
        private readonly ILogger<NotificationService> _logger;

        public NotificationService(AppDbContext context, ILogger<NotificationService> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Dispatches a new notification to a user and logs mock email notification for audit purposes.
        /// </summary>
        public async Task CreateNotificationAsync(int userId, string title, string message, string type, int? relatedTaskId = null)
        {
            var notification = new Notification
            {
                UserId = userId,
                Title = title.Trim(),
                Message = message.Trim(),
                Type = type,
                RelatedTaskId = relatedTaskId,
                IsRead = false,
                Status = 1,
                IsDeleted = false,
                CreatedDate = DateTime.UtcNow
            };

            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync();

            // Mock transactional email notification dispatch (pluggable with SMTP / SendGrid)
            var user = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId);
            if (user != null)
            {
                _logger.LogInformation("[DISPATCH NOTIFICATION] To: {Email} | Subject: {Title} | Body: {Message}", 
                    user.Email, title, message);
            }
        }

        /// <summary>
        /// Retrieves the top 50 notifications for a recipient using high-performance non-tracking projection.
        /// </summary>
        public async Task<List<NotificationDto>> GetUserNotificationsAsync(int userId)
        {
            return await _context.Notifications
                .AsNoTracking()
                .Where(n => n.UserId == userId)
                .OrderByDescending(n => n.CreatedDate)
                .Take(50)
                .Select(n => new NotificationDto
                {
                    Id = n.Id,
                    UserId = n.UserId,
                    Title = n.Title,
                    Message = n.Message,
                    Type = n.Type,
                    RelatedTaskId = n.RelatedTaskId,
                    IsRead = n.IsRead,
                    CreatedAt = n.CreatedDate
                })
                .ToListAsync();
        }

        /// <summary>
        /// Returns count of unread notifications for badge visualization using an optimized count query.
        /// </summary>
        public async Task<int> GetUnreadCountAsync(int userId)
        {
            return await _context.Notifications
                .AsNoTracking()
                .Where(n => n.UserId == userId && !n.IsRead)
                .CountAsync();
        }

        /// <summary>
        /// Acknowledges an individual notification as read.
        /// </summary>
        public async Task<bool> MarkAsReadAsync(int notificationId, int userId)
        {
            var notification = await _context.Notifications
                .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId);

            if (notification == null) return false;

            notification.IsRead = true;
            notification.LastUpdatedDate = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return true;
        }

        /// <summary>
        /// Acknowledges all pending unread notifications for a user simultaneously.
        /// </summary>
        public async Task<bool> MarkAllAsReadAsync(int userId)
        {
            var unread = await _context.Notifications
                .Where(n => n.UserId == userId && !n.IsRead)
                .ToListAsync();

            if (!unread.Any()) return true;

            var now = DateTime.UtcNow;
            foreach (var n in unread)
            {
                n.IsRead = true;
                n.LastUpdatedDate = now;
            }

            await _context.SaveChangesAsync();
            return true;
        }
    }
}
