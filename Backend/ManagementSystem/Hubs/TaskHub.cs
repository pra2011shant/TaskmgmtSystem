using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace ManagementSystem.Hubs
{
    [Authorize]
    public class TaskHub : Hub
    {
        public async Task JoinTaskRoom(string taskId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"Task_{taskId}");
        }

        public async Task LeaveTaskRoom(string taskId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"Task_{taskId}");
        }

        public async Task JoinUserRoom(string userId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"User_{userId}");
        }
    }
}
