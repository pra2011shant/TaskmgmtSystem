using System.Security.Claims;
using ManagementSystem.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ManagementSystem.Controllers
{
    /// <summary>
    /// RESTful API Controller managing asynchronous user alerts, notification retrieval, and read state tracking.
    /// </summary>
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class NotificationsController : ControllerBase
    {
        private readonly INotificationService _notificationService;

        public NotificationsController(INotificationService notificationService)
        {
            _notificationService = notificationService;
        }

        private int CurrentUserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        /// <summary>
        /// Retrieves the authenticated user's notification list and unread alert count (GET /api/notifications).
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetNotifications()
        {
            var notifications = await _notificationService.GetUserNotificationsAsync(CurrentUserId);
            var unreadCount = await _notificationService.GetUnreadCountAsync(CurrentUserId);

            return Ok(new { notifications, unreadCount });
        }

        /// <summary>
        /// Acknowledges an individual notification as read (PATCH /api/notifications/{id}/read).
        /// </summary>
        [HttpPatch("{id}/read")]
        public async Task<IActionResult> MarkAsRead(int id)
        {
            var success = await _notificationService.MarkAsReadAsync(id, CurrentUserId);
            if (!success) return NotFound(new { message = "Notification not found." });

            return Ok(new { message = "Marked as read." });
        }

        /// <summary>
        /// Acknowledges all pending unread notifications for the active user (PATCH /api/notifications/read-all).
        /// </summary>
        [HttpPatch("read-all")]
        public async Task<IActionResult> MarkAllAsRead()
        {
            await _notificationService.MarkAllAsReadAsync(CurrentUserId);
            return Ok(new { message = "All notifications marked as read." });
        }
    }
}
