using ManagementSystem.Data;
using ManagementSystem.DTOs;
using ManagementSystem.Models;
using Microsoft.EntityFrameworkCore;

namespace ManagementSystem.Services
{
    public interface IProjectService
    {
        Task<List<ProjectDto>> GetProjectsAsync();
        Task<ProjectDto?> GetProjectByIdAsync(int id);
        Task<(bool Success, string Message, ProjectDto? Data)> CreateProjectAsync(CreateProjectDto dto, int currentUserId);
        Task<(bool Success, string Message, MilestoneDto? Data)> AddMilestoneAsync(int projectId, CreateMilestoneDto dto, int currentUserId);
    }

    public class ProjectService : IProjectService
    {
        private readonly AppDbContext _context;
        private readonly ILogger<ProjectService> _logger;

        public ProjectService(AppDbContext context, ILogger<ProjectService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<List<ProjectDto>> GetProjectsAsync()
        {
            try
            {
                var projects = await _context.Projects
                    .Include(p => p.Team)
                    .Include(p => p.Manager)
                    .Include(p => p.Milestones)
                        .ThenInclude(m => m.Tasks)
                    .Include(p => p.Tasks)
                    .AsNoTracking()
                    .ToListAsync();

                return projects.Select(MapToDto).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred in GetProjectsAsync");
                throw;
            }
        }

        public async Task<ProjectDto?> GetProjectByIdAsync(int id)
        {
            var project = await _context.Projects
                .Include(p => p.Team)
                .Include(p => p.Manager)
                .Include(p => p.Milestones)
                    .ThenInclude(m => m.Tasks)
                .Include(p => p.Tasks)
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.Id == id);

            return project == null ? null : MapToDto(project);
        }

        public async Task<(bool Success, string Message, ProjectDto? Data)> CreateProjectAsync(CreateProjectDto dto, int currentUserId)
        {
            try
            {
                var normalizedKey = dto.ProjectKey.Trim().ToUpper();
                if (await _context.Projects.AnyAsync(p => p.ProjectKey == normalizedKey))
                {
                    return (false, "A project with this project key already exists.", null);
                }

                var project = new Project
                {
                    ProjectKey = normalizedKey,
                    Name = dto.Name.Trim(),
                    Description = dto.Description?.Trim() ?? string.Empty,
                    TeamId = dto.TeamId,
                    ManagerId = dto.ManagerId,
                    StartDate = dto.StartDate,
                    EndDate = dto.EndDate,
                    Budget = dto.Budget,
                    CreatedById = currentUserId,
                    CreatedDate = DateTime.UtcNow
                };

                _context.Projects.Add(project);
                await _context.SaveChangesAsync();

                var loaded = await GetProjectByIdAsync(project.Id);
                return (true, "Project created successfully.", loaded);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to create project");
                return (false, "Error occurred creating project.", null);
            }
        }

        public async Task<(bool Success, string Message, MilestoneDto? Data)> AddMilestoneAsync(int projectId, CreateMilestoneDto dto, int currentUserId)
        {
            var project = await _context.Projects.FindAsync(projectId);
            if (project == null) return (false, "Project not found.", null);

            var milestone = new Milestone
            {
                ProjectId = projectId,
                Title = dto.Title.Trim(),
                Description = dto.Description?.Trim() ?? string.Empty,
                DueDate = dto.DueDate,
                CreatedDate = DateTime.UtcNow,
                CreatedById = currentUserId
            };

            _context.Milestones.Add(milestone);
            await _context.SaveChangesAsync();

            return (true, "Milestone added.", new MilestoneDto
            {
                Id = milestone.Id,
                ProjectId = milestone.ProjectId,
                Title = milestone.Title,
                Description = milestone.Description,
                DueDate = milestone.DueDate,
                ProgressPercentage = milestone.ProgressPercentage,
                MilestoneStatus = milestone.MilestoneStatus,
                TasksCount = 0,
                CompletedTasksCount = 0
            });
        }

        private static ProjectDto MapToDto(Project p)
        {
            var totalTasks = p.Tasks.Count(t => !t.IsDeleted);
            var completedTasks = p.Tasks.Count(t => !t.IsDeleted && t.Status == TaskStatusEnum.Done);
            var rate = totalTasks > 0 ? Math.Round((decimal)completedTasks / totalTasks * 100, 1) : 0;

            return new ProjectDto
            {
                Id = p.Id,
                ProjectKey = p.ProjectKey,
                Name = p.Name,
                Description = p.Description,
                TeamId = p.TeamId,
                TeamName = p.Team?.Name,
                ManagerId = p.ManagerId,
                ManagerName = p.Manager?.FullName,
                StartDate = p.StartDate,
                EndDate = p.EndDate,
                Budget = p.Budget,
                ProjectStatus = p.ProjectStatus,
                TasksCount = totalTasks,
                CompletedTasksCount = completedTasks,
                CompletionRate = rate,
                Milestones = p.Milestones.Where(m => !m.IsDeleted).Select(m => new MilestoneDto
                {
                    Id = m.Id,
                    ProjectId = m.ProjectId,
                    Title = m.Title,
                    Description = m.Description,
                    DueDate = m.DueDate,
                    ProgressPercentage = m.ProgressPercentage,
                    MilestoneStatus = m.MilestoneStatus,
                    TasksCount = m.Tasks?.Count(t => !t.IsDeleted) ?? 0,
                    CompletedTasksCount = m.Tasks?.Count(t => !t.IsDeleted && t.Status == TaskStatusEnum.Done) ?? 0
                }).ToList()
            };
        }
    }
}
