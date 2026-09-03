using System.ComponentModel.DataAnnotations;

namespace ManagementSystem.DTOs
{
    /// <summary>
    /// Request payload for provisioning a new organizational team.
    /// </summary>
    public class CreateTeamDto
    {
        [Required]
        [MaxLength(150)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(500)]
        public string Description { get; set; } = string.Empty;

        public int? ManagerId { get; set; }
    }

    /// <summary>
    /// Request payload for updating team metadata and managerial assignment.
    /// </summary>
    public class UpdateTeamDto
    {
        [Required]
        [MaxLength(150)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(500)]
        public string Description { get; set; } = string.Empty;

        public int? ManagerId { get; set; }
    }

    /// <summary>
    /// Request payload for enrolling a user into team roster.
    /// </summary>
    public class AddTeamMemberDto
    {
        [Required]
        public int UserId { get; set; }
    }

    /// <summary>
    /// Roster member projection returned in team queries.
    /// </summary>
    public class TeamMemberDto
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public DateTime JoinedAt { get; set; }
    }

    /// <summary>
    /// Team entity response payload including manager metadata and member roster.
    /// </summary>
    public class TeamDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int? ManagerId { get; set; }
        public string? ManagerName { get; set; }
        public string? ManagerEmail { get; set; }
        public DateTime CreatedAt { get; set; }
        public List<TeamMemberDto> Members { get; set; } = new List<TeamMemberDto>();
        public int TasksCount { get; set; }
    }
}
