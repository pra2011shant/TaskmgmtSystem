using System.Security.Claims;
using ManagementSystem.DTOs;
using ManagementSystem.Models;
using ManagementSystem.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ManagementSystem.Controllers
{
    /// <summary>
    /// RESTful API Controller handling identity provisioning, credentialed login, refresh tokens, and active user session retrieval.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        private string? GetClientIp() => HttpContext.Connection.RemoteIpAddress?.ToString();

        /// <summary>
        /// Registers a new user account (POST /api/auth/register).
        /// </summary>
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequestDto dto)
        {
            if (!ModelState.IsValid)
            {
                var errorMessages = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage)
                    .Where(m => !string.IsNullOrEmpty(m))
                    .ToList();
                return BadRequest(new { message = string.Join(" ", errorMessages) });
            }

            var (success, message, data) = await _authService.RegisterAsync(dto, GetClientIp());
            if (!success)
            {
                return BadRequest(new { message });
            }

            return Ok(data);
        }

        /// <summary>
        /// Authenticates user credentials and issues a signed JWT bearer token and refresh token (POST /api/auth/login).
        /// </summary>
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequestDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var (success, message, data) = await _authService.LoginAsync(dto, GetClientIp());
            if (!success)
            {
                return Unauthorized(new { message });
            }

            return Ok(data);
        }

        /// <summary>
        /// Rotates the refresh token and issues a fresh JWT access token (POST /api/auth/refresh-token).
        /// </summary>
        [HttpPost("refresh-token")]
        public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequestDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.RefreshToken))
            {
                return BadRequest(new { message = "Refresh token is required." });
            }

            var (success, message, data) = await _authService.RefreshTokenAsync(dto.RefreshToken, GetClientIp());
            if (!success)
            {
                return Unauthorized(new { message });
            }

            return Ok(data);
        }

        /// <summary>
        /// Revokes active refresh token on logout (POST /api/auth/revoke-token).
        /// </summary>
        [Authorize]
        [HttpPost("revoke-token")]
        public async Task<IActionResult> RevokeToken([FromBody] RevokeTokenRequestDto? dto)
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            int.TryParse(userIdClaim, out var userId);

            var (success, message) = await _authService.RevokeTokenAsync(dto?.RefreshToken, userId > 0 ? userId : null);
            return Ok(new { success, message });
        }

        /// <summary>
        /// Retrieves the authenticated user profile (GET /api/auth/me).
        /// </summary>
        [Authorize]
        [HttpGet("me")]
        public async Task<IActionResult> GetCurrentUser()
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized();
            }

            var user = await _authService.GetUserByIdAsync(userId);
            if (user == null)
            {
                return NotFound(new { message = "User not found." });
            }

            return Ok(user);
        }

        /// <summary>
        /// Retrieves active user directory for task assignee selection (GET /api/auth/users).
        /// </summary>
        [Authorize]
        [HttpGet("users")]
        public async Task<IActionResult> GetAllUsers()
        {
            var users = await _authService.GetAllUsersAsync();
            return Ok(users);
        }
    }
}
