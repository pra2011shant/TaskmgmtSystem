using ManagementSystem.Data;
using ManagementSystem.DTOs;
using ManagementSystem.Models;
using Microsoft.EntityFrameworkCore;
using System.Text.RegularExpressions;

namespace ManagementSystem.Services
{
    public interface ITaskService
    {
        Task<List<TaskDto>> GetTasksAsync(TaskFilterDto filter, int currentUserId, string role);
        Task<TaskDto?> GetTaskByIdAsync(int id, int currentUserId, string role);
        Task<(bool Success, string Message, TaskDto? Data)> CreateTaskAsync(CreateTaskDto dto, int currentUserId, string role, string? ipAddress = null);
        Task<(bool Success, string Message, TaskDto? Data)> UpdateTaskAsync(int id, UpdateTaskDto dto, int currentUserId, string role, string? ipAddress = null);
        Task<(bool Success, string Message, TaskDto? Data)> UpdateTaskStatusAsync(int id, TaskStatusEnum newStatus, int currentUserId, string role, string? ipAddress = null);
        Task<(bool Success, string Message)> DeleteTaskAsync(int id, int currentUserId, string role, string? ipAddress = null);
        Task<List<CommentDto>> GetCommentsAsync(int taskId);
        Task<(bool Success, string Message, CommentDto? Data)> AddCommentAsync(int taskId, string content, int currentUserId, int? parentCommentId = null, string? ipAddress = null);
        Task<(bool Success, string Message, CommentDto? Data)> UpdateCommentAsync(int commentId, string content, int currentUserId);
        Task<(bool Success, string Message)> DeleteCommentAsync(int commentId, int currentUserId, string role);
        Task<(bool Success, string Message, SubTaskDto? Data)> AddSubTaskAsync(int taskId, CreateSubTaskDto dto, int currentUserId, string role);
        Task<(bool Success, string Message, SubTaskDto? Data)> UpdateSubTaskAsync(int subTaskId, UpdateSubTaskDto dto, int currentUserId, string role);
        Task<(bool Success, string Message)> DeleteSubTaskAsync(int subTaskId, int currentUserId, string role);
        Task<DashboardSummaryDto> GetDashboardSummaryAsync(int currentUserId, string role);
    }

    public class TaskService : ITaskService
    {
        private readonly AppDbContext _context;
        private readonly INotificationService _notificationService;
        private readonly IAuditService _auditService;
        private readonly ILogger<TaskService> _logger;

        public TaskService(AppDbContext context, INotificationService notificationService, IAuditService auditService, ILogger<TaskService> logger)
        {
            _context = context;
            _notificationService = notificationService;
            _auditService = auditService;
            _logger = logger;
        }

        public async Task<List<TaskDto>> GetTasksAsync(TaskFilterDto filter, int currentUserId, string role)
        {
            var query = BuildTaskQuery(currentUserId, role, asNoTracking: true);

            if (!string.IsNullOrWhiteSpace(filter.Search))
            {
                var term = filter.Search.Trim().ToLower();
                query = query.Where(t => t.Title.ToLower().Contains(term) ||
                                         (t.Description != null && t.Description.ToLower().Contains(term)) ||
                                         (t.Tags != null && t.Tags.ToLower().Contains(term)) ||
                                         (t.Category != null && t.Category.ToLower().Contains(term)));
            }

            if (filter.Status.HasValue)
            {
                query = query.Where(t => t.Status == filter.Status.Value);
            }

            if (filter.Priority.HasValue)
            {
                query = query.Where(t => t.Priority == filter.Priority.Value);
            }

            if (!string.IsNullOrWhiteSpace(filter.Category))
            {
                query = query.Where(t => t.Category == filter.Category);
            }

            if (!string.IsNullOrWhiteSpace(filter.Tag))
            {
                query = query.Where(t => t.Tags != null && t.Tags.Contains(filter.Tag));
            }

            if (filter.TeamId.HasValue)
            {
                query = query.Where(t => t.TeamId == filter.TeamId.Value);
            }

            if (filter.AssignedToUserId.HasValue)
            {
                query = query.Where(t => t.AssignedToUserId == filter.AssignedToUserId.Value);
            }

            if (filter.IsOverdue.HasValue && filter.IsOverdue.Value)
            {
                query = query.Where(t => t.DueDate.HasValue && t.DueDate.Value < DateTime.UtcNow && t.Status != TaskStatusEnum.Done);
            }

            if (filter.DueDateFrom.HasValue)
            {
                query = query.Where(t => t.DueDate >= filter.DueDateFrom.Value);
            }

            if (filter.DueDateTo.HasValue)
            {
                query = query.Where(t => t.DueDate <= filter.DueDateTo.Value);
            }

            // Ordering
            query = filter.SortBy?.ToLower() switch
            {
                "title" => filter.SortDescending ? query.OrderByDescending(t => t.Title) : query.OrderBy(t => t.Title),
                "duedate" => filter.SortDescending ? query.OrderByDescending(t => t.DueDate) : query.OrderBy(t => t.DueDate),
                "priority" => filter.SortDescending ? query.OrderByDescending(t => t.Priority) : query.OrderBy(t => t.Priority),
                "status" => filter.SortDescending ? query.OrderByDescending(t => t.Status) : query.OrderBy(t => t.Status),
                _ => query.OrderByDescending(t => t.CreatedDate)
            };

            var tasks = await query
                .Include(t => t.Team)
                .Include(t => t.AssignedToUser)
                .Include(t => t.CreatedByUser)
                .Include(t => t.SubTasks)
                .Include(t => t.Attachments)
                .Include(t => t.Comments)
                .Skip((filter.Page - 1) * filter.PageSize)
                .Take(filter.PageSize)
                .ToListAsync();

            return tasks.Select(MapToDto).ToList();
        }

        public async Task<TaskDto?> GetTaskByIdAsync(int id, int currentUserId, string role)
        {
            var query = BuildTaskQuery(currentUserId, role, asNoTracking: true);
            var task = await query
                .Include(t => t.Team)
                .Include(t => t.AssignedToUser)
                .Include(t => t.CreatedByUser)
                .Include(t => t.SubTasks)
                .Include(t => t.Attachments)
                .Include(t => t.Comments)
                .FirstOrDefaultAsync(t => t.Id == id);

            return task == null ? null : MapToDto(task);
        }

        public async Task<(bool Success, string Message, TaskDto? Data)> CreateTaskAsync(CreateTaskDto dto, int currentUserId, string role, string? ipAddress = null)
        {
            try
            {
                var task = new TaskItem
                {
                    Title = dto.Title.Trim(),
                    Description = dto.Description?.Trim() ?? string.Empty,
                    Status = dto.Status,
                    Priority = dto.Priority,
                    Category = string.IsNullOrWhiteSpace(dto.Category) ? "General" : dto.Category.Trim(),
                    Tags = dto.Tags?.Trim(),
                    EstimatedHours = dto.EstimatedHours,
                    ActualHours = dto.ActualHours,
                    DueDate = dto.DueDate,
                    TeamId = dto.TeamId,
                    AssignedToUserId = dto.AssignedToUserId,
                    Remarks = dto.Remarks?.Trim(),
                    CreatedById = currentUserId,
                    CreatedDate = DateTime.UtcNow
                };

                if (dto.InitialSubtasks != null && dto.InitialSubtasks.Count > 0)
                {
                    int order = 1;
                    foreach (var stTitle in dto.InitialSubtasks.Where(s => !string.IsNullOrWhiteSpace(s)))
                    {
                        task.SubTasks.Add(new SubTask
                        {
                            Title = stTitle.Trim(),
                            SortOrder = order++,
                            CreatedDate = DateTime.UtcNow
                        });
                    }
                }

                _context.Tasks.Add(task);
                await _context.SaveChangesAsync();

                // Send notification to assignee
                if (task.AssignedToUserId.HasValue && task.AssignedToUserId.Value != currentUserId)
                {
                    var creator = await _context.Users.FindAsync(currentUserId);
                    var creatorName = creator?.FullName ?? "Administrator";
                    await _notificationService.CreateNotificationAsync(
                        task.AssignedToUserId.Value,
                        "New Task Assigned",
                        $"{creatorName} assigned you a new task: \"{task.Title}\"",
                        "TaskAssigned",
                        task.Id
                    );
                }

                var user = await _context.Users.FindAsync(currentUserId);
                await _auditService.LogAsync("TaskCreated", "Task", task.Id.ToString(), null, new { task.Title, task.Priority, task.Status, task.AssignedToUserId }, currentUserId, user?.FullName, role, ipAddress);

                var loadedTask = await GetTaskByIdAsync(task.Id, currentUserId, role);
                return (true, "Task created successfully.", loadedTask);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to create task");
                return (false, "An error occurred while creating the task.", null);
            }
        }

        public async Task<(bool Success, string Message, TaskDto? Data)> UpdateTaskAsync(int id, UpdateTaskDto dto, int currentUserId, string role, string? ipAddress = null)
        {
            try
            {
                var query = BuildTaskQuery(currentUserId, role, asNoTracking: false);
                var task = await query.Include(t => t.SubTasks).FirstOrDefaultAsync(t => t.Id == id);

                if (task == null)
                {
                    return (false, "Task not found or access denied.", null);
                }

                var oldState = new { task.Title, task.Status, task.Priority, task.AssignedToUserId, task.DueDate };
                var previousAssignee = task.AssignedToUserId;

                task.Title = dto.Title.Trim();
                task.Description = dto.Description?.Trim() ?? string.Empty;
                task.Status = dto.Status;
                task.Priority = dto.Priority;
                task.Category = string.IsNullOrWhiteSpace(dto.Category) ? "General" : dto.Category.Trim();
                task.Tags = dto.Tags?.Trim();
                task.EstimatedHours = dto.EstimatedHours;
                task.ActualHours = dto.ActualHours;
                task.DueDate = dto.DueDate;
                task.TeamId = dto.TeamId;
                task.AssignedToUserId = dto.AssignedToUserId;
                task.Remarks = dto.Remarks?.Trim();
                task.LastUpdatedDate = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                if (task.AssignedToUserId.HasValue && task.AssignedToUserId != previousAssignee && task.AssignedToUserId.Value != currentUserId)
                {
                    var updater = await _context.Users.FindAsync(currentUserId);
                    var updaterName = updater?.FullName ?? "A team member";
                    await _notificationService.CreateNotificationAsync(
                        task.AssignedToUserId.Value,
                        "Task Reassigned",
                        $"{updaterName} reassigned task \"{task.Title}\" to you.",
                        "TaskAssigned",
                        task.Id
                    );
                }

                var user = await _context.Users.FindAsync(currentUserId);
                var newState = new { task.Title, task.Status, task.Priority, task.AssignedToUserId, task.DueDate };
                await _auditService.LogAsync("TaskUpdated", "Task", task.Id.ToString(), oldState, newState, currentUserId, user?.FullName, role, ipAddress);

                var loadedTask = await GetTaskByIdAsync(task.Id, currentUserId, role);
                return (true, "Task updated successfully.", loadedTask);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to update task ID {Id}", id);
                return (false, "An error occurred while updating the task.", null);
            }
        }

        public async Task<(bool Success, string Message, TaskDto? Data)> UpdateTaskStatusAsync(int id, TaskStatusEnum newStatus, int currentUserId, string role, string? ipAddress = null)
        {
            try
            {
                var query = BuildTaskQuery(currentUserId, role, asNoTracking: false);
                var task = await query.FirstOrDefaultAsync(t => t.Id == id);

                if (task == null)
                {
                    return (false, "Task not found or access denied.", null);
                }

                var oldStatus = task.Status;
                task.Status = newStatus;
                task.LastUpdatedDate = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                // Alert creator or assignee
                var actor = await _context.Users.FindAsync(currentUserId);
                var actorName = actor?.FullName ?? "A user";

                if (task.CreatedById.HasValue && task.CreatedById.Value != currentUserId)
                {
                    await _notificationService.CreateNotificationAsync(
                        task.CreatedById.Value,
                        "Task Status Changed",
                        $"{actorName} updated status of \"{task.Title}\" to {newStatus}",
                        "StatusUpdated",
                        task.Id
                    );
                }

                await _auditService.LogAsync("TaskStatusChanged", "Task", task.Id.ToString(), new { Status = oldStatus }, new { Status = newStatus }, currentUserId, actor?.FullName, role, ipAddress);

                var loadedTask = await GetTaskByIdAsync(task.Id, currentUserId, role);
                return (true, "Status updated successfully.", loadedTask);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to update status for task ID {Id}", id);
                return (false, "An error occurred updating task status.", null);
            }
        }

        public async Task<(bool Success, string Message)> DeleteTaskAsync(int id, int currentUserId, string role, string? ipAddress = null)
        {
            try
            {
                var query = BuildTaskQuery(currentUserId, role, asNoTracking: false);
                var task = await query.FirstOrDefaultAsync(t => t.Id == id);

                if (task == null)
                {
                    return (false, "Task not found or unauthorized to delete.");
                }

                task.IsDeleted = true;
                task.LastUpdatedDate = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                var actor = await _context.Users.FindAsync(currentUserId);
                await _auditService.LogAsync("TaskDeleted", "Task", id.ToString(), new { task.Title }, null, currentUserId, actor?.FullName, role, ipAddress);

                return (true, "Task deleted successfully.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to delete task ID {Id}", id);
                return (false, "An error occurred while deleting the task.");
            }
        }

        public async Task<List<CommentDto>> GetCommentsAsync(int taskId)
        {
            var comments = await _context.Comments
                .AsNoTracking()
                .Where(c => c.TaskId == taskId && c.ParentCommentId == null)
                .Include(c => c.User)
                .Include(c => c.Replies)
                    .ThenInclude(r => r.User)
                .OrderBy(c => c.CreatedDate)
                .ToListAsync();

            return comments.Select(MapCommentToDto).ToList();
        }

        public async Task<(bool Success, string Message, CommentDto? Data)> AddCommentAsync(int taskId, string content, int currentUserId, int? parentCommentId = null, string? ipAddress = null)
        {
            try
            {
                var task = await _context.Tasks.FindAsync(taskId);
                if (task == null)
                {
                    return (false, "Task not found.", null);
                }

                var comment = new TaskComment
                {
                    TaskId = taskId,
                    UserId = currentUserId,
                    Content = content.Trim(),
                    ParentCommentId = parentCommentId,
                    CreatedDate = DateTime.UtcNow
                };

                _context.Comments.Add(comment);
                await _context.SaveChangesAsync();

                var actor = await _context.Users.FindAsync(currentUserId);
                var actorName = actor?.FullName ?? "Someone";

                // Parse @mentions
                var mentionMatches = Regex.Matches(content, @"@(\w+)");
                foreach (Match match in mentionMatches)
                {
                    var mentionedName = match.Groups[1].Value.ToLower();
                    var mentionedUser = await _context.Users.FirstOrDefaultAsync(u => u.FullName.ToLower().Replace(" ", "").Contains(mentionedName));
                    if (mentionedUser != null && mentionedUser.Id != currentUserId)
                    {
                        await _notificationService.CreateNotificationAsync(
                            mentionedUser.Id,
                            "You were mentioned in a comment",
                            $"{actorName} mentioned you on task \"{task.Title}\": \"{content}\"",
                            "MentionAdded",
                            task.Id
                        );
                    }
                }

                // Notify assignee / creator if they weren't the ones commenting
                if (task.AssignedToUserId.HasValue && task.AssignedToUserId.Value != currentUserId)
                {
                    await _notificationService.CreateNotificationAsync(
                        task.AssignedToUserId.Value,
                        "New Comment on Task",
                        $"{actorName} commented on \"{task.Title}\"",
                        "CommentAdded",
                        task.Id
                    );
                }

                await _auditService.LogAsync("CommentAdded", "TaskComment", comment.Id.ToString(), null, new { TaskId = taskId, Content = content }, currentUserId, actor?.FullName, actor?.Role.ToString(), ipAddress);

                var loadedComment = await _context.Comments
                    .Include(c => c.User)
                    .Include(c => c.Replies).ThenInclude(r => r.User)
                    .FirstOrDefaultAsync(c => c.Id == comment.Id);

                return (true, "Comment posted successfully.", loadedComment != null ? MapCommentToDto(loadedComment) : null);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to add comment to task {TaskId}", taskId);
                return (false, "An error occurred while posting comment.", null);
            }
        }

        public async Task<(bool Success, string Message, CommentDto? Data)> UpdateCommentAsync(int commentId, string content, int currentUserId)
        {
            var comment = await _context.Comments.Include(c => c.User).FirstOrDefaultAsync(c => c.Id == commentId);
            if (comment == null) return (false, "Comment not found.", null);
            if (comment.UserId != currentUserId) return (false, "You can only edit your own comments.", null);

            comment.Content = content.Trim();
            comment.IsEdited = true;
            comment.LastUpdatedDate = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return (true, "Comment updated.", MapCommentToDto(comment));
        }

        public async Task<(bool Success, string Message)> DeleteCommentAsync(int commentId, int currentUserId, string role)
        {
            var comment = await _context.Comments.FirstOrDefaultAsync(c => c.Id == commentId);
            if (comment == null) return (false, "Comment not found.");
            if (comment.UserId != currentUserId && role != "Admin") return (false, "Unauthorized to delete this comment.");

            comment.IsDeleted = true;
            comment.LastUpdatedDate = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return (true, "Comment deleted.");
        }

        public async Task<(bool Success, string Message, SubTaskDto? Data)> AddSubTaskAsync(int taskId, CreateSubTaskDto dto, int currentUserId, string role)
        {
            var task = await _context.Tasks.FindAsync(taskId);
            if (task == null) return (false, "Task not found.", null);

            var subTask = new SubTask
            {
                TaskId = taskId,
                Title = dto.Title.Trim(),
                SortOrder = dto.SortOrder,
                CreatedDate = DateTime.UtcNow
            };

            _context.SubTasks.Add(subTask);
            await _context.SaveChangesAsync();

            return (true, "Subtask added.", new SubTaskDto
            {
                Id = subTask.Id,
                TaskId = subTask.TaskId,
                Title = subTask.Title,
                IsCompleted = subTask.IsCompleted,
                SortOrder = subTask.SortOrder,
                CreatedDate = subTask.CreatedDate
            });
        }

        public async Task<(bool Success, string Message, SubTaskDto? Data)> UpdateSubTaskAsync(int subTaskId, UpdateSubTaskDto dto, int currentUserId, string role)
        {
            var subTask = await _context.SubTasks.FindAsync(subTaskId);
            if (subTask == null) return (false, "Subtask not found.", null);

            subTask.Title = dto.Title.Trim();
            subTask.IsCompleted = dto.IsCompleted;
            subTask.SortOrder = dto.SortOrder;
            subTask.LastUpdatedDate = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return (true, "Subtask updated.", new SubTaskDto
            {
                Id = subTask.Id,
                TaskId = subTask.TaskId,
                Title = subTask.Title,
                IsCompleted = subTask.IsCompleted,
                SortOrder = subTask.SortOrder,
                CreatedDate = subTask.CreatedDate
            });
        }

        public async Task<(bool Success, string Message)> DeleteSubTaskAsync(int subTaskId, int currentUserId, string role)
        {
            var subTask = await _context.SubTasks.FindAsync(subTaskId);
            if (subTask == null) return (false, "Subtask not found.");

            _context.SubTasks.Remove(subTask);
            await _context.SaveChangesAsync();
            return (true, "Subtask removed.");
        }

        public async Task<DashboardSummaryDto> GetDashboardSummaryAsync(int currentUserId, string role)
        {
            var query = BuildTaskQuery(currentUserId, role, asNoTracking: true);

            var total = await query.CountAsync();
            var completed = await query.CountAsync(t => t.Status == TaskStatusEnum.Done);
            var inProgress = await query.CountAsync(t => t.Status == TaskStatusEnum.InProgress);
            var todo = await query.CountAsync(t => t.Status == TaskStatusEnum.ToDo || t.Status == TaskStatusEnum.Created || t.Status == TaskStatusEnum.Assigned);
            var review = await query.CountAsync(t => t.Status == TaskStatusEnum.Review);
            var overdue = await query.CountAsync(t => t.DueDate.HasValue && t.DueDate.Value < DateTime.UtcNow && t.Status != TaskStatusEnum.Done);

            var priorityDist = await query
                .GroupBy(t => t.Priority)
                .Select(g => new PriorityDistributionDto
                {
                    Priority = g.Key.ToString(),
                    Count = g.Count()
                }).ToListAsync();

            var statusDist = await query
                .GroupBy(t => t.Status)
                .Select(g => new StatusDistributionDto
                {
                    Status = g.Key.ToString(),
                    Count = g.Count()
                }).ToListAsync();

            var recentActivity = await _context.AuditLogs
                .OrderByDescending(a => a.Timestamp)
                .Take(10)
                .Select(a => new RecentActivityDto
                {
                    Id = (int)a.Id,
                    UserName = a.UserName ?? "System",
                    Action = a.Action,
                    Entity = a.EntityName,
                    Timestamp = a.Timestamp
                }).ToListAsync();

            return new DashboardSummaryDto
            {
                TotalTasks = total,
                CompletedTasks = completed,
                InProgressTasks = inProgress,
                PendingTasks = todo + review,
                OverdueTasks = overdue,
                PriorityDistribution = priorityDist,
                StatusDistribution = statusDist,
                RecentActivities = recentActivity
            };
        }

        private IQueryable<TaskItem> BuildTaskQuery(int currentUserId, string role, bool asNoTracking = true)
        {
            var query = _context.Tasks.AsQueryable();
            if (asNoTracking) query = query.AsNoTracking();

            if (role == "Admin")
            {
                return query;
            }

            if (role == "Manager")
            {
                var managedTeamIds = _context.Teams
                    .Where(t => t.ManagerId == currentUserId)
                    .Select(t => t.Id);

                return query.Where(t =>
                    t.CreatedById == currentUserId ||
                    t.AssignedToUserId == currentUserId ||
                    (t.TeamId.HasValue && managedTeamIds.Contains(t.TeamId.Value))
                );
            }

            // Regular User
            return query.Where(t =>
                t.AssignedToUserId == currentUserId ||
                t.CreatedById == currentUserId
            );
        }

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
                Category = task.Category ?? "General",
                Tags = task.Tags,
                EstimatedHours = task.EstimatedHours,
                ActualHours = task.ActualHours,
                DueDate = task.DueDate,
                TeamId = task.TeamId,
                TeamName = task.Team?.Name,
                AssignedToUserId = task.AssignedToUserId,
                AssignedToUserName = task.AssignedToUser?.FullName,
                AssignedToUserEmail = task.AssignedToUser?.Email,
                CreatedByUserId = task.CreatedById ?? 1,
                CreatedByUserName = task.CreatedByUser?.FullName ?? "System",
                CreatedAt = task.CreatedDate,
                UpdatedAt = task.LastUpdatedDate,
                Remarks = task.Remarks,
                IsDeleted = task.IsDeleted,
                CreatedDate = task.CreatedDate,
                LastUpdatedDate = task.LastUpdatedDate,
                CreatedById = task.CreatedById,
                CommentsCount = task.Comments?.Count ?? 0,
                SubtasksCount = task.SubTasks?.Count ?? 0,
                CompletedSubtasksCount = task.SubTasks?.Count(st => st.IsCompleted) ?? 0,
                AttachmentsCount = task.Attachments?.Count ?? 0,
                SubTasks = task.SubTasks?.Select(st => new SubTaskDto
                {
                    Id = st.Id,
                    TaskId = st.TaskId,
                    Title = st.Title,
                    IsCompleted = st.IsCompleted,
                    SortOrder = st.SortOrder,
                    CreatedDate = st.CreatedDate
                }).OrderBy(st => st.SortOrder).ToList() ?? new List<SubTaskDto>(),
                Attachments = task.Attachments?.Select(ta => new TaskAttachmentDto
                {
                    Id = ta.Id,
                    TaskId = ta.TaskId,
                    FileName = ta.FileName,
                    ContentType = ta.ContentType,
                    FileSize = ta.FileSize,
                    UploadedById = ta.UploadedById,
                    UploadedByUserName = ta.UploadedByUser?.FullName ?? "User",
                    CreatedDate = ta.CreatedDate,
                    DownloadUrl = $"/api/attachments/{ta.Id}/download"
                }).ToList() ?? new List<TaskAttachmentDto>()
            };
        }

        private static CommentDto MapCommentToDto(TaskComment comment)
        {
            return new CommentDto
            {
                Id = comment.Id,
                TaskId = comment.TaskId,
                UserId = comment.UserId,
                UserName = comment.User?.FullName ?? "User",
                UserRole = comment.User?.Role.ToString() ?? "User",
                Content = comment.Content,
                ParentCommentId = comment.ParentCommentId,
                IsEdited = comment.IsEdited,
                CreatedAt = comment.CreatedDate,
                Replies = comment.Replies?.Select(MapCommentToDto).ToList() ?? new List<CommentDto>()
            };
        }
    }
}
