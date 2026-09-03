using ManagementSystem.Data;
using ManagementSystem.DTOs;
using ManagementSystem.Models;
using Microsoft.EntityFrameworkCore;

namespace ManagementSystem.Services
{
    /// <summary>
    /// Service contract defining operations for task lifecycle management, multi-criteria filtering,
    /// discussion comments, and real-time dashboard analytics.
    /// </summary>
    public interface ITaskService
    {
        /// <summary>
        /// Retrieves filtered tasks according to search terms, state flags, and RBAC visibility rules.
        /// </summary>
        Task<List<TaskDto>> GetTasksAsync(TaskFilterDto filter, int currentUserId, string role);

        /// <summary>
        /// Retrieves a single task entity by ID with authorization verification.
        /// </summary>
        Task<TaskDto?> GetTaskByIdAsync(int id, int currentUserId, string role);

        /// <summary>
        /// Provisions a new work task and dispatches notification alerts to the assignee.
        /// </summary>
        Task<(bool Success, string Message, TaskDto? Data)> CreateTaskAsync(CreateTaskDto dto, int currentUserId, string role);

        /// <summary>
        /// Updates an existing work task and alerts assignees on delegation or status modifications.
        /// </summary>
        Task<(bool Success, string Message, TaskDto? Data)> UpdateTaskAsync(int id, UpdateTaskDto dto, int currentUserId, string role);

        /// <summary>
        /// Executes a lightweight state transition (ToDo -> InProgress -> Done).
        /// </summary>
        Task<(bool Success, string Message, TaskDto? Data)> UpdateTaskStatusAsync(int id, TaskStatusEnum newStatus, int currentUserId, string role);

        /// <summary>
        /// Executes a logical soft-delete on a target task, preserving audit history.
        /// </summary>
        Task<(bool Success, string Message)> DeleteTaskAsync(int id, int currentUserId, string role);

        /// <summary>
        /// Retrieves chronological discussion comments for a specific task.
        /// </summary>
        Task<List<CommentDto>> GetCommentsAsync(int taskId);

        /// <summary>
        /// Appends a collaboration comment to a task thread and notifies stakeholders.
        /// </summary>
        Task<(bool Success, string Message, CommentDto? Data)> AddCommentAsync(int taskId, string content, int currentUserId);

        /// <summary>
        /// Aggregates key performance metrics, overdue alerts, and workflow distributions.
        /// </summary>
        Task<DashboardSummaryDto> GetDashboardSummaryAsync(int currentUserId, string role);
    }

    /// <summary>
    /// Implementation of task management services enforcing role-based access control,
    /// audit trails, soft deletion, and event-driven notifications.
    /// </summary>
    public class TaskService : ITaskService
    {
        private readonly AppDbContext _context;
        private readonly INotificationService _notificationService;

        public TaskService(AppDbContext context, INotificationService notificationService)
        {
            _context = context;
            _notificationService = notificationService;
        }

        /// <summary>
        /// Retrieves tasks filtered by criteria with high-performance AsNoTracking query execution.
        /// </summary>
        public async Task<List<TaskDto>> GetTasksAsync(TaskFilterDto filter, int currentUserId, string role)
        {
            var query = BuildTaskQuery(currentUserId, role, asNoTracking: true);

            // 1. Full-text search across Title and Description
            if (!string.IsNullOrWhiteSpace(filter.Search))
            {
                var term = filter.Search.Trim().ToLower();
                query = query.Where(t => t.Title.ToLower().Contains(term) || t.Description.ToLower().Contains(term));
            }

            // 2. Status Filter
            if (filter.Status.HasValue)
            {
                query = query.Where(t => t.Status == filter.Status.Value);
            }

            // 3. Priority Filter
            if (filter.Priority.HasValue)
            {
                query = query.Where(t => t.Priority == filter.Priority.Value);
            }

            // 4. Department / Team Filter
            if (filter.TeamId.HasValue)
            {
                query = query.Where(t => t.TeamId == filter.TeamId.Value);
            }

            // 5. Assignee User Filter
            if (filter.AssignedToUserId.HasValue)
            {
                query = query.Where(t => t.AssignedToUserId == filter.AssignedToUserId.Value);
            }

            // 6. Overdue Tasks Filter (Target date elapsed and task incomplete)
            if (filter.IsOverdue.HasValue && filter.IsOverdue.Value)
            {
                var now = DateTime.UtcNow;
                query = query.Where(t => t.DueDate.HasValue && t.DueDate.Value < now && t.Status != TaskStatusEnum.Done);
            }

            var tasks = await query.OrderByDescending(t => t.CreatedDate).ToListAsync();
            return tasks.Select(t => MapToDto(t)).ToList();
        }

        /// <summary>
        /// Retrieves a single task by ID with relational eager loading and role authorization checks.
        /// </summary>
        public async Task<TaskDto?> GetTaskByIdAsync(int id, int currentUserId, string role)
        {
            var task = await _context.Tasks
                .AsNoTracking()
                .Include(t => t.Team)
                .Include(t => t.AssignedToUser)
                .Include(t => t.CreatedByUser)
                .Include(t => t.Comments)
                .FirstOrDefaultAsync(t => t.Id == id);

            if (task == null) return null;

            // Security Partitioning: Standard members may only view tasks assigned to them or within their teams
            if (role == UserRole.User.ToString() && task.AssignedToUserId != currentUserId && task.CreatedById != currentUserId)
            {
                var inTeam = task.TeamId.HasValue && await _context.TeamMembers
                    .AsNoTracking()
                    .AnyAsync(m => m.TeamId == task.TeamId && m.UserId == currentUserId);

                if (!inTeam) return null;
            }

            return MapToDto(task);
        }

        /// <summary>
        /// Provisions a new work task and dispatches notification alerts to the designated assignee.
        /// </summary>
        public async Task<(bool Success, string Message, TaskDto? Data)> CreateTaskAsync(CreateTaskDto dto, int currentUserId, string role)
        {
            var creator = await _context.Users.FindAsync(currentUserId);
            if (creator == null) return (false, "Creator user not found.", null);

            var task = new TaskItem
            {
                Title = dto.Title.Trim(),
                Description = dto.Description.Trim(),
                Status = dto.Status,
                Priority = dto.Priority,
                DueDate = dto.DueDate,
                TeamId = dto.TeamId,
                AssignedToUserId = dto.AssignedToUserId,
                CreatedById = currentUserId,
                Remarks = dto.Remarks?.Trim(),
                IsDeleted = false,
                CreatedDate = DateTime.UtcNow
            };

            _context.Tasks.Add(task);
            await _context.SaveChangesAsync();

            // Dispatch notification if assigned to another user
            if (task.AssignedToUserId.HasValue && task.AssignedToUserId.Value != currentUserId)
            {
                await _notificationService.CreateNotificationAsync(
                    task.AssignedToUserId.Value,
                    "New Task Assigned",
                    $"You have been assigned to task: '{task.Title}' by {creator.FullName}.",
                    "TaskAssigned",
                    task.Id
                );
            }

            var loadedTask = await GetTaskByIdAsync(task.Id, currentUserId, role);
            return (true, "Task created successfully.", loadedTask);
        }

        /// <summary>
        /// Updates task specifications and dispatches event alerts upon reassignment or status changes.
        /// </summary>
        public async Task<(bool Success, string Message, TaskDto? Data)> UpdateTaskAsync(int id, UpdateTaskDto dto, int currentUserId, string role)
        {
            var task = await _context.Tasks.FindAsync(id);
            if (task == null) return (false, "Task not found.", null);

            var originalAssignee = task.AssignedToUserId;
            var originalStatus = task.Status;

            task.Title = dto.Title.Trim();
            task.Description = dto.Description.Trim();
            task.Status = dto.Status;
            task.Priority = dto.Priority;
            task.DueDate = dto.DueDate;
            task.TeamId = dto.TeamId;
            task.AssignedToUserId = dto.AssignedToUserId;
            if (dto.Remarks != null)
            {
                task.Remarks = dto.Remarks.Trim();
            }
            task.LastUpdatedDate = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            var updater = await _context.Users.FindAsync(currentUserId);
            var updaterName = updater?.FullName ?? "A team member";

            // Dispatch alert upon assignee delegation
            if (task.AssignedToUserId.HasValue && task.AssignedToUserId != originalAssignee && task.AssignedToUserId != currentUserId)
            {
                await _notificationService.CreateNotificationAsync(
                    task.AssignedToUserId.Value,
                    "Task Assigned",
                    $"You have been assigned to task: '{task.Title}' by {updaterName}.",
                    "TaskAssigned",
                    task.Id
                );
            }

            // Dispatch alert upon status progression
            if (originalStatus != task.Status)
            {
                await NotifyStatusChangeAsync(task, originalStatus, task.Status, currentUserId, updaterName);
            }

            var loadedTask = await GetTaskByIdAsync(id, currentUserId, role);
            return (true, "Task updated successfully.", loadedTask);
        }

        /// <summary>
        /// Modifies status state machine value and publishes workflow transition event.
        /// </summary>
        public async Task<(bool Success, string Message, TaskDto? Data)> UpdateTaskStatusAsync(int id, TaskStatusEnum newStatus, int currentUserId, string role)
        {
            var task = await _context.Tasks.FindAsync(id);
            if (task == null) return (false, "Task not found.", null);

            var originalStatus = task.Status;
            if (originalStatus == newStatus)
            {
                var current = await GetTaskByIdAsync(id, currentUserId, role);
                return (true, "Status already set.", current);
            }

            task.Status = newStatus;
            task.LastUpdatedDate = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            var updater = await _context.Users.FindAsync(currentUserId);
            var updaterName = updater?.FullName ?? "A user";

            await NotifyStatusChangeAsync(task, originalStatus, newStatus, currentUserId, updaterName);

            var loadedTask = await GetTaskByIdAsync(id, currentUserId, role);
            return (true, $"Status updated to {newStatus}.", loadedTask);
        }

        /// <summary>
        /// Executes a logical soft delete on the task, verifying authorization.
        /// </summary>
        public async Task<(bool Success, string Message)> DeleteTaskAsync(int id, int currentUserId, string role)
        {
            var task = await _context.Tasks.FindAsync(id);
            if (task == null) return (false, "Task not found.");

            if (role == UserRole.User.ToString() && task.CreatedById != currentUserId)
            {
                return (false, "You do not have permission to delete this task.");
            }

            // Enforce logical soft deletion
            task.IsDeleted = true;
            task.LastUpdatedDate = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return (true, "Task deleted successfully.");
        }

        /// <summary>
        /// Retrieves discussion comments for a task using non-tracking projection.
        /// </summary>
        public async Task<List<CommentDto>> GetCommentsAsync(int taskId)
        {
            return await _context.Comments
                .AsNoTracking()
                .Include(c => c.User)
                .Where(c => c.TaskId == taskId)
                .OrderBy(c => c.CreatedDate)
                .Select(c => new CommentDto
                {
                    Id = c.Id,
                    TaskId = c.TaskId,
                    UserId = c.UserId,
                    UserName = c.User.FullName,
                    UserRole = c.User.Role.ToString(),
                    Content = c.Content,
                    CreatedAt = c.CreatedDate
                })
                .ToListAsync();
        }

        /// <summary>
        /// Appends a new discussion comment and dispatches notifications to task stakeholders.
        /// </summary>
        public async Task<(bool Success, string Message, CommentDto? Data)> AddCommentAsync(int taskId, string content, int currentUserId)
        {
            var task = await _context.Tasks.FindAsync(taskId);
            if (task == null) return (false, "Task not found.", null);

            var user = await _context.Users.FindAsync(currentUserId);
            if (user == null) return (false, "User not found.", null);

            var comment = new TaskComment
            {
                TaskId = taskId,
                UserId = currentUserId,
                Content = content.Trim(),
                Status = 1,
                IsDeleted = false,
                CreatedDate = DateTime.UtcNow
            };

            _context.Comments.Add(comment);
            await _context.SaveChangesAsync();

            // Notify assignee and creator if distinct from commenter
            var notifyRecipients = new HashSet<int>();
            if (task.AssignedToUserId.HasValue && task.AssignedToUserId != currentUserId)
            {
                notifyRecipients.Add(task.AssignedToUserId.Value);
            }
            if (task.CreatedById.HasValue && task.CreatedById.Value != currentUserId)
            {
                notifyRecipients.Add(task.CreatedById.Value);
            }

            foreach (var recipientId in notifyRecipients)
            {
                await _notificationService.CreateNotificationAsync(
                    recipientId,
                    "New Comment on Task",
                    $"{user.FullName} commented on '{task.Title}': \"{(content.Length > 40 ? content.Substring(0, 37) + "..." : content)}\"",
                    "CommentAdded",
                    taskId
                );
            }

            var dto = new CommentDto
            {
                Id = comment.Id,
                TaskId = comment.TaskId,
                UserId = comment.UserId,
                UserName = user.FullName,
                UserRole = user.Role.ToString(),
                Content = comment.Content,
                CreatedAt = comment.CreatedDate
            };

            return (true, "Comment added successfully.", dto);
        }

        /// <summary>
        /// Computes real-time executive dashboard metrics, completion rates, and priority distribution.
        /// </summary>
        public async Task<DashboardSummaryDto> GetDashboardSummaryAsync(int currentUserId, string role)
        {
            var query = BuildTaskQuery(currentUserId, role, asNoTracking: true);
            var tasks = await query.ToListAsync();
            var now = DateTime.UtcNow;

            var totalTasks = tasks.Count;
            var todo = tasks.Count(t => t.Status == TaskStatusEnum.ToDo);
            var inProgress = tasks.Count(t => t.Status == TaskStatusEnum.InProgress);
            var done = tasks.Count(t => t.Status == TaskStatusEnum.Done);
            var overdue = tasks.Count(t => t.DueDate.HasValue && t.DueDate.Value < now && t.Status != TaskStatusEnum.Done);

            var priorityStats = tasks.GroupBy(t => t.Priority)
                .Select(g => new PriorityStatDto
                {
                    Priority = g.Key.ToString(),
                    Count = g.Count()
                })
                .ToList();

            var totalTeams = role == UserRole.Admin.ToString() 
                ? await _context.Teams.AsNoTracking().CountAsync()
                : await _context.TeamMembers.AsNoTracking().Where(m => m.UserId == currentUserId).Select(m => m.TeamId).Distinct().CountAsync();

            var totalUsers = await _context.Users.AsNoTracking().CountAsync();
            var unreadNotifs = await _notificationService.GetUnreadCountAsync(currentUserId);

            var recentTasks = tasks.OrderByDescending(t => t.CreatedDate).Take(5).Select(t => MapToDto(t)).ToList();
            var recentNotifs = await _notificationService.GetUserNotificationsAsync(currentUserId);

            return new DashboardSummaryDto
            {
                TotalTasks = totalTasks,
                ToDoTasks = todo,
                InProgressTasks = inProgress,
                DoneTasks = done,
                OverdueTasks = overdue,
                TotalTeams = totalTeams,
                TotalUsers = totalUsers,
                UnreadNotifications = unreadNotifs,
                TasksByPriority = priorityStats,
                RecentTasks = recentTasks,
                RecentNotifications = recentNotifs.Take(5).ToList()
            };
        }

        /// <summary>
        /// Constructs RBAC-scoped task queries.
        /// </summary>
        private IQueryable<TaskItem> BuildTaskQuery(int currentUserId, string role, bool asNoTracking = false)
        {
            var query = _context.Tasks
                .Include(t => t.Team)
                .Include(t => t.AssignedToUser)
                .Include(t => t.CreatedByUser)
                .Include(t => t.Comments)
                .AsQueryable();

            if (asNoTracking)
            {
                query = query.AsNoTracking();
            }

            if (role == UserRole.Manager.ToString())
            {
                query = query.Where(t => (t.Team != null && t.Team.ManagerId == currentUserId) ||
                                         t.CreatedById == currentUserId ||
                                         t.AssignedToUserId == currentUserId);
            }
            else if (role == UserRole.User.ToString())
            {
                query = query.Where(t => t.AssignedToUserId == currentUserId || t.CreatedById == currentUserId);
            }

            return query;
        }

        /// <summary>
        /// Dispatches notification alerts upon task state transitions.
        /// </summary>
        private async Task NotifyStatusChangeAsync(TaskItem task, TaskStatusEnum oldStatus, TaskStatusEnum newStatus, int currentUserId, string updaterName)
        {
            var recipients = new HashSet<int>();
            if (task.AssignedToUserId.HasValue && task.AssignedToUserId != currentUserId)
            {
                recipients.Add(task.AssignedToUserId.Value);
            }
            if (task.CreatedById.HasValue && task.CreatedById.Value != currentUserId)
            {
                recipients.Add(task.CreatedById.Value);
            }

            foreach (var recipientId in recipients)
            {
                await _notificationService.CreateNotificationAsync(
                    recipientId,
                    "Task Status Updated",
                    $"Task '{task.Title}' status changed from '{oldStatus}' to '{newStatus}' by {updaterName}.",
                    "StatusUpdated",
                    task.Id
                );
            }
        }

        /// <summary>
        /// Maps TaskItem entity model to clean DTO payload.
        /// </summary>
        private static TaskDto MapToDto(TaskItem task)
        {
            return new TaskDto
            {
                Id = task.Id,
                Title = task.Title,
                Description = task.Description,
                Status = task.Status.ToString(),
                StatusValue = (int)task.Status,
                Priority = task.Priority.ToString(),
                PriorityValue = (int)task.Priority,
                DueDate = task.DueDate,
                TeamId = task.TeamId,
                TeamName = task.Team?.Name,
                AssignedToUserId = task.AssignedToUserId,
                AssignedToUserName = task.AssignedToUser?.FullName,
                AssignedToUserEmail = task.AssignedToUser?.Email,
                CreatedByUserId = task.CreatedByUserId,
                CreatedByUserName = task.CreatedByUser?.FullName ?? "System",
                CreatedAt = task.CreatedDate,
                UpdatedAt = task.LastUpdatedDate,
                CommentsCount = task.Comments?.Count ?? 0,
                Remarks = task.Remarks,
                IsDeleted = task.IsDeleted,
                CreatedDate = task.CreatedDate,
                LastUpdatedDate = task.LastUpdatedDate,
                CreatedById = task.CreatedById ?? task.CreatedByUserId
            };
        }
    }
}
