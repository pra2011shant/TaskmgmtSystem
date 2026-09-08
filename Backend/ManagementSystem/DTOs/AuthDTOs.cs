using System.ComponentModel.DataAnnotations;
using ManagementSystem.Models;

namespace ManagementSystem.DTOs
{
    /// <summary>
    /// Registration request payload with complexity rules.
    /// </summary>
    public class RegisterRequestDto
    {
        [Required(ErrorMessage = "Full Name is required.")]
        [MaxLength(100)]
        public string FullName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Email is required.")]
        [EmailAddress(ErrorMessage = "Invalid email format.")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "Password is required.")]
        [MinLength(6, ErrorMessage = "Password must be at least 6 characters long.")]
        [RegularExpression(@"^(?=.*[^a-zA-Z0-9]).{6,}$", ErrorMessage = "Password must be at least 6 characters long and contain at least one special character (e.g. @, #, $, %, !).")]
        public string Password { get; set; } = string.Empty;

        public UserRole Role { get; set; } = UserRole.User;

        [MaxLength(100)]
        public string? Department { get; set; }

        [MaxLength(500)]
        public string? Remarks { get; set; }
    }

    /// <summary>
    /// Credentialed authentication request payload.
    /// </summary>
    public class LoginRequestDto
    {
        [Required(ErrorMessage = "Email is required.")]
        [EmailAddress(ErrorMessage = "Invalid email format.")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "Password is required.")]
        public string Password { get; set; } = string.Empty;
    }

    /// <summary>
    /// Refresh token request payload.
    /// </summary>
    public class RefreshTokenRequestDto
    {
        [Required]
        public string RefreshToken { get; set; } = string.Empty;
    }

    /// <summary>
    /// Revoke token request payload.
    /// </summary>
    public class RevokeTokenRequestDto
    {
        public string? RefreshToken { get; set; }
    }

    /// <summary>
    /// Authentication session response payload.
    /// </summary>
    public class AuthResponseDto
    {
        public string Token { get; set; } = string.Empty;
        public DateTime Expiration { get; set; }
        public string RefreshToken { get; set; } = string.Empty;
        public DateTime RefreshTokenExpiration { get; set; }
        public UserDto User { get; set; } = null!;
        public List<string> Permissions { get; set; } = new List<string>();
    }

    /// <summary>
    /// Publicly consumable user profile representation.
    /// </summary>
    public class UserDto
    {
        public int Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public string? Department { get; set; }
        public DateTime CreatedAt { get; set; }
        public string? Remarks { get; set; }
        public int Status { get; set; } = 1;
        public bool IsDeleted { get; set; } = false;
        public bool IsLockedOut { get; set; } = false;
        public DateTime? LastUpdatedDate { get; set; }
        public int? CreatedById { get; set; }
    }
}
