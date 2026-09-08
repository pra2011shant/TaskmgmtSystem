using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ManagementSystem.Models
{
    /// <summary>
    /// Database Table: [TeamMembers]
    /// Purpose: Many-to-many relationship mapping employees into squads and teams.
    /// </summary>
    [Table("TeamMembers")]
    public class TeamMember : BaseEntity
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int TeamId { get; set; }

        [ForeignKey(nameof(TeamId))]
        public Team Team { get; set; } = null!;

        [Required]
        public int UserId { get; set; }

        [ForeignKey(nameof(UserId))]
        public User User { get; set; } = null!;

        [NotMapped]
        public DateTime JoinedAt
        {
            get => CreatedDate;
            set => CreatedDate = value;
        }
    }
}
