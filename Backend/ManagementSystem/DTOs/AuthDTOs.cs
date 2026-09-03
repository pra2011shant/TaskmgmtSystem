using System.ComponentModel.DataAnnotations;
using ManagementSystem.Models;

namespace ManagementSystem.DTOs
{
    /// <summary>
    /// Registration request payload with complexity rules (minimum 6 characters and 1 special symbol).
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

        /// <summary>
        /// Designated authorization role: Admin, Manager, User.
        /// </summary>
        public UserRole Role { get; set; } = UserRole.User;

        /// <summary>
        /// Optional administrative remarks.
        /// </summary>
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
    /// Authentication session response payload containing serialized JWT bearer token and user claims.
    /// </summary>
    public class AuthResponseDto
    {
        public string Token { get; set; } = string.Empty;
        public DateTime Expiration { get; set; }
        public UserDto User { get; set; } = null!;
    }

    /// <summary>
    /// Publicly consumable user profile representation without credential hashes.
    /// </summary>
    public class UserDto
    {
        public int Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public string? Remarks { get; set; }
        public int Status { get; set; } = 1;
        public bool IsDeleted { get; set; } = false;
        public DateTime? LastUpdatedDate { get; set; }
        public int? CreatedById { get; set; }
    }
}
