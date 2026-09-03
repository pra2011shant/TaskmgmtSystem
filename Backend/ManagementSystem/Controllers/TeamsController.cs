using System.Security.Claims;
using ManagementSystem.DTOs;
using ManagementSystem.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ManagementSystem.Controllers
{
    /// <summary>
    /// RESTful API Controller managing organizational teams, departmental rosters, and member associations.
    /// </summary>
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class TeamsController : ControllerBase
    {
        private readonly ITeamService _teamService;

        public TeamsController(ITeamService teamService)
        {
            _teamService = teamService;
        }

        private int CurrentUserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        private string CurrentUserRole => User.FindFirstValue(ClaimTypes.Role) ?? "User";

        /// <summary>
        /// Retrieves teams accessible by the authenticated user based on role privileges (GET /api/teams).
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetTeams()
        {
            var teams = await _teamService.GetTeamsAsync(CurrentUserId, CurrentUserRole);
            return Ok(teams);
        }

        /// <summary>
        /// Retrieves team specifications and roster membership by unique ID (GET /api/teams/{id}).
        /// </summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetTeamById(int id)
        {
            var team = await _teamService.GetTeamByIdAsync(id);
            if (team == null) return NotFound(new { message = "Team not found." });
            return Ok(team);
        }

        /// <summary>
        /// Provisions a new organizational team (Admin and Manager roles only) (POST /api/teams).
        /// </summary>
        [HttpPost]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> CreateTeam([FromBody] CreateTeamDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var (success, message, data) = await _teamService.CreateTeamAsync(dto, CurrentUserId);
            if (!success) return BadRequest(new { message });

            return CreatedAtAction(nameof(GetTeamById), new { id = data!.Id }, data);
        }

        /// <summary>
        /// Updates team details including manager assignment (Admin and Manager roles only) (PUT /api/teams/{id}).
        /// </summary>
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> UpdateTeam(int id, [FromBody] UpdateTeamDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var (success, message, data) = await _teamService.UpdateTeamAsync(id, dto);
            if (!success) return BadRequest(new { message });

            return Ok(data);
        }

        /// <summary>
        /// Logically soft-deletes a team (Admin role only) (DELETE /api/teams/{id}).
        /// </summary>
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteTeam(int id)
        {
            var (success, message) = await _teamService.DeleteTeamAsync(id);
            if (!success) return BadRequest(new { message });

            return Ok(new { message });
        }

        /// <summary>
        /// Enrolls a user as an active member of the specified team (Admin and Manager roles only) (POST /api/teams/{id}/members).
        /// </summary>
        [HttpPost("{id}/members")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> AddMember(int id, [FromBody] AddTeamMemberDto dto)
        {
            var (success, message) = await _teamService.AddMemberAsync(id, dto.UserId);
            if (!success) return BadRequest(new { message });

            var updatedTeam = await _teamService.GetTeamByIdAsync(id);
            return Ok(updatedTeam);
        }

        /// <summary>
        /// Removes a user from a team roster (Admin and Manager roles only) (DELETE /api/teams/{id}/members/{userId}).
        /// </summary>
        [HttpDelete("{id}/members/{userId}")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> RemoveMember(int id, int userId)
        {
            var (success, message) = await _teamService.RemoveMemberAsync(id, userId);
            if (!success) return BadRequest(new { message });

            var updatedTeam = await _teamService.GetTeamByIdAsync(id);
            return Ok(updatedTeam);
        }
    }
}
