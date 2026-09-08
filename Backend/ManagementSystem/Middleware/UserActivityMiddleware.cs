using System.Security.Claims;
using ManagementSystem.Data;
using Microsoft.EntityFrameworkCore;

namespace ManagementSystem.Middleware
{
    public class UserActivityMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<UserActivityMiddleware> _logger;

        public UserActivityMiddleware(RequestDelegate next, ILogger<UserActivityMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context, IServiceProvider serviceProvider)
        {
            await _next(context);

            // Execute activity update asynchronously after response is initiated/completed
            if (context.User?.Identity?.IsAuthenticated == true)
            {
                var userIdClaim = context.User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (int.TryParse(userIdClaim, out var userId) && userId > 0)
                {
                    // Don't update presence on logout/revoke-token requests
                    var path = context.Request.Path.Value?.ToLower() ?? string.Empty;
                    if (!path.Contains("revoke-token") && !path.Contains("logout"))
                    {
                        try
                        {
                            using var scope = serviceProvider.CreateScope();
                            var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

                            var user = await dbContext.Users.FindAsync(userId);
                            if (user != null)
                            {
                                user.IsOnline = true;
                                user.LastActivityDate = DateTime.UtcNow;

                                var clientIp = context.Connection.RemoteIpAddress?.ToString();
                                if (!string.IsNullOrWhiteSpace(clientIp))
                                {
                                    user.LastIpAddress = clientIp;
                                }

                                var userAgent = context.Request.Headers.UserAgent.ToString();
                                if (!string.IsNullOrWhiteSpace(userAgent) && userAgent.Length > 0)
                                {
                                    user.LastUserAgent = userAgent.Length > 255 ? userAgent.Substring(0, 255) : userAgent;
                                }

                                await dbContext.SaveChangesAsync();
                            }
                        }
                        catch (Exception ex)
                        {
                            _logger.LogWarning(ex, "Failed to update user activity presence for UserId: {UserId}", userId);
                        }
                    }
                }
            }
        }
    }
}
