using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ManagementSystem.Models
{
    /// <summary>
    /// Database Table: [RefreshTokens]
    /// Purpose: Cryptographic refresh tokens for secure JWT session sliding rotation.
    /// </summary>
    [Table("RefreshTokens")]
    public class RefreshToken : BaseEntity
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int UserId { get; set; }

        [ForeignKey(nameof(UserId))]
        public User User { get; set; } = null!;

        [Required]
        [MaxLength(256)]
        public string Token { get; set; } = string.Empty;

        public DateTime ExpiryDate { get; set; }

        public bool IsRevoked { get; set; } = false;

        [MaxLength(50)]
        public string? CreatedByIp { get; set; }

        [NotMapped]
        public bool IsActive => !IsRevoked && DateTime.UtcNow < ExpiryDate;
    }
}
