using System.Security.Claims;
using ManagementSystem.DTOs;
using ManagementSystem.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ManagementSystem.Controllers
{
    /// <summary>
    /// RESTful API Controller handling identity provisioning, credentialed login, and active user session retrieval.
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

        /// <summary>
        /// Registers a new user account with role selection and complexity validation (POST /api/auth/register).
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

            var (success, message, data) = await _authService.RegisterAsync(dto);
            if (!success)
            {
                return BadRequest(new { message });
            }

            return Ok(data);
        }

        /// <summary>
        /// Authenticates user credentials and issues a signed JWT authorization bearer token (POST /api/auth/login).
        /// </summary>
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequestDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var (success, message, data) = await _authService.LoginAsync(dto);
            if (!success)
            {
                return Unauthorized(new { message });
            }

            return Ok(data);
        }

        /// <summary>
        /// Retrieves the authenticated user profile using claims extracted from JWT bearer token (GET /api/auth/me).
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
        /// Retrieves active user directory for task assignee selection and roster picks (GET /api/auth/users).
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
