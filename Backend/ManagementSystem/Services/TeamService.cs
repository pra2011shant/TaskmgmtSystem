using ManagementSystem.Data;
using ManagementSystem.DTOs;
using ManagementSystem.Models;
using Microsoft.EntityFrameworkCore;

namespace ManagementSystem.Services
{
    /// <summary>
    /// Service contract defining team creation, roster administration, and departmental queries.
    /// </summary>
    public interface ITeamService
    {
        /// <summary>
        /// Retrieves teams accessible by the current user based on RBAC roles.
        /// </summary>
        Task<List<TeamDto>> GetTeamsAsync(int currentUserId, string role);

        /// <summary>
        /// Retrieves detailed team information including roster members and assigned manager.
        /// </summary>
        Task<TeamDto?> GetTeamByIdAsync(int id);

        /// <summary>
        /// Provisions a new organizational team and automatically links designated manager.
        /// </summary>
        Task<(bool Success, string Message, TeamDto? Data)> CreateTeamAsync(CreateTeamDto dto, int currentUserId);

        /// <summary>
        /// Updates team attributes (name, mission description, and assigned manager).
        /// </summary>
        Task<(bool Success, string Message, TeamDto? Data)> UpdateTeamAsync(int id, UpdateTeamDto dto);

        /// <summary>
        /// Logically soft-deletes a team from active operational views.
        /// </summary>
        Task<(bool Success, string Message)> DeleteTeamAsync(int id);

        /// <summary>
        /// Enrolls an active user into a team's membership roster.
        /// </summary>
        Task<(bool Success, string Message)> AddMemberAsync(int teamId, int userId);

        /// <summary>
        /// Removes a member from a team roster via logical soft delete.
        /// </summary>
        Task<(bool Success, string Message)> RemoveMemberAsync(int teamId, int userId);
    }

    /// <summary>
    /// Implementation of team management services enforcing role-based team visibility and membership integrity.
    /// </summary>
    public class TeamService : ITeamService
    {
        private readonly AppDbContext _context;

        public TeamService(AppDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Retrieves teams filtered by user security context:
        /// Admins have global visibility; Managers see led or enrolled teams; Users see joined teams.
        /// </summary>
        public async Task<List<TeamDto>> GetTeamsAsync(int currentUserId, string role)
        {
            IQueryable<Team> query = _context.Teams
                .AsNoTracking()
                .Include(t => t.Manager)
                .Include(t => t.Members)
                    .ThenInclude(m => m.User)
                .Include(t => t.Tasks);

            if (role == UserRole.Manager.ToString())
            {
                query = query.Where(t => t.ManagerId == currentUserId || t.Members.Any(m => m.UserId == currentUserId));
            }
            else if (role == UserRole.User.ToString())
            {
                query = query.Where(t => t.Members.Any(m => m.UserId == currentUserId));
            }

            var teams = await query.OrderByDescending(t => t.CreatedDate).ToListAsync();
            return teams.Select(t => MapToDto(t)).ToList();
        }

        /// <summary>
        /// Retrieves a single team by unique ID using non-tracking eager loading.
        /// </summary>
        public async Task<TeamDto?> GetTeamByIdAsync(int id)
        {
            var team = await _context.Teams
                .AsNoTracking()
                .Include(t => t.Manager)
                .Include(t => t.Members)
                    .ThenInclude(m => m.User)
                .Include(t => t.Tasks)
                .FirstOrDefaultAsync(t => t.Id == id);

            return team == null ? null : MapToDto(team);
        }

        /// <summary>
        /// Creates a new team and registers the assigned manager into the member roster.
        /// </summary>
        public async Task<(bool Success, string Message, TeamDto? Data)> CreateTeamAsync(CreateTeamDto dto, int currentUserId)
        {
            var team = new Team
            {
                Name = dto.Name.Trim(),
                Description = dto.Description.Trim(),
                ManagerId = dto.ManagerId ?? currentUserId,
                Status = 1,
                IsDeleted = false,
                CreatedDate = DateTime.UtcNow,
                CreatedById = currentUserId
            };

            _context.Teams.Add(team);
            await _context.SaveChangesAsync();

            // Automatically associate the manager within the team member roster
            if (team.ManagerId.HasValue)
            {
                _context.TeamMembers.Add(new TeamMember
                {
                    TeamId = team.Id,
                    UserId = team.ManagerId.Value,
                    Status = 1,
                    IsDeleted = false,
                    CreatedDate = DateTime.UtcNow,
                    CreatedById = currentUserId
                });
                await _context.SaveChangesAsync();
            }

            var loadedTeam = await GetTeamByIdAsync(team.Id);
            return (true, "Team created successfully.", loadedTeam);
        }

        /// <summary>
        /// Updates team details including manager re-assignment.
        /// </summary>
        public async Task<(bool Success, string Message, TeamDto? Data)> UpdateTeamAsync(int id, UpdateTeamDto dto)
        {
            var team = await _context.Teams.FindAsync(id);
            if (team == null) return (false, "Team not found.", null);

            team.Name = dto.Name.Trim();
            team.Description = dto.Description.Trim();
            if (dto.ManagerId.HasValue)
            {
                team.ManagerId = dto.ManagerId.Value;
            }
            team.LastUpdatedDate = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            var loadedTeam = await GetTeamByIdAsync(id);
            return (true, "Team updated successfully.", loadedTeam);
        }

        /// <summary>
        /// Logically soft-deletes the team entity.
        /// </summary>
        public async Task<(bool Success, string Message)> DeleteTeamAsync(int id)
        {
            var team = await _context.Teams.FindAsync(id);
            if (team == null) return (false, "Team not found.");

            team.IsDeleted = true;
            team.LastUpdatedDate = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return (true, "Team deleted successfully.");
        }

        /// <summary>
        /// Enrolls a user as a member of the specified team.
        /// </summary>
        public async Task<(bool Success, string Message)> AddMemberAsync(int teamId, int userId)
        {
            var team = await _context.Teams.FindAsync(teamId);
            if (team == null) return (false, "Team not found.");

            var user = await _context.Users.FindAsync(userId);
            if (user == null) return (false, "User not found.");

            var exists = await _context.TeamMembers.AnyAsync(m => m.TeamId == teamId && m.UserId == userId);
            if (exists) return (false, "User is already an active member of this team.");

            _context.TeamMembers.Add(new TeamMember
            {
                TeamId = teamId,
                UserId = userId,
                Status = 1,
                IsDeleted = false,
                CreatedDate = DateTime.UtcNow
            });

            await _context.SaveChangesAsync();
            return (true, "Member added successfully.");
        }

        /// <summary>
        /// Soft-deletes member association from the specified team.
        /// </summary>
        public async Task<(bool Success, string Message)> RemoveMemberAsync(int teamId, int userId)
        {
            var member = await _context.TeamMembers.FirstOrDefaultAsync(m => m.TeamId == teamId && m.UserId == userId);
            if (member == null) return (false, "Member not found in this team.");

            member.IsDeleted = true;
            member.LastUpdatedDate = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return (true, "Member removed successfully.");
        }

        /// <summary>
        /// Helper mapping Team entity to DTO representation.
        /// </summary>
        private static TeamDto MapToDto(Team team)
        {
            return new TeamDto
            {
                Id = team.Id,
                Name = team.Name,
                Description = team.Description,
                ManagerId = team.ManagerId,
                ManagerName = team.Manager?.FullName,
                ManagerEmail = team.Manager?.Email,
                CreatedAt = team.CreatedDate,
                TasksCount = team.Tasks?.Count ?? 0,
                Members = team.Members?.Where(m => !m.IsDeleted).Select(m => new TeamMemberDto
                {
                    Id = m.Id,
                    UserId = m.UserId,
                    FullName = m.User?.FullName ?? string.Empty,
                    Email = m.User?.Email ?? string.Empty,
                    Role = m.User?.Role.ToString() ?? string.Empty,
                    JoinedAt = m.CreatedDate
                }).ToList() ?? new List<TeamMemberDto>()
            };
        }
    }
}
