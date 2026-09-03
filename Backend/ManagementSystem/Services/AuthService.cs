using System.Text.RegularExpressions;
using ManagementSystem.Data;
using ManagementSystem.DTOs;
using ManagementSystem.Helpers;
using ManagementSystem.Models;
using Microsoft.EntityFrameworkCore;

namespace ManagementSystem.Services
{
    /// <summary>
    /// Service contract defining identity authentication, account registration, and user directory retrieval.
    /// </summary>
    public interface IAuthService
    {
        /// <summary>
        /// Registers a new user account with cryptographic validation and role assignment.
        /// </summary>
        Task<(bool Success, string Message, AuthResponseDto? Data)> RegisterAsync(RegisterRequestDto dto);

        /// <summary>
        /// Authenticates user credentials and issues a signed JWT bearer token.
        /// </summary>
        Task<(bool Success, string Message, AuthResponseDto? Data)> LoginAsync(LoginRequestDto dto);

        /// <summary>
        /// Retrieves a user profile by unique identifier.
        /// </summary>
        Task<UserDto?> GetUserByIdAsync(int id);

        /// <summary>
        /// Retrieves all active users for administrative directories and dropdown assignees.
        /// </summary>
        Task<List<UserDto>> GetAllUsersAsync();
    }

    /// <summary>
    /// Implementation of authentication services with BCrypt password hashing and JWT token issuance.
    /// </summary>
    public class AuthService : IAuthService
    {
        private readonly AppDbContext _context;
        private readonly IJwtHelper _jwtHelper;

        public AuthService(AppDbContext context, IJwtHelper jwtHelper)
        {
            _context = context;
            _jwtHelper = jwtHelper;
        }

        /// <summary>
        /// Registers a new user account verifying password complexity requirements (minimum 6 characters and special character).
        /// </summary>
        public async Task<(bool Success, string Message, AuthResponseDto? Data)> RegisterAsync(RegisterRequestDto dto)
        {
            try
            {
                // 1. Password Complexity Validation: Minimum 6 characters and at least 1 special symbol
                if (string.IsNullOrWhiteSpace(dto.Password) || dto.Password.Length < 6)
                {
                    return (false, "Password must be at least 6 characters long.", null);
                }

                var hasSpecialChar = Regex.IsMatch(dto.Password, @"[^a-zA-Z0-9]");
                if (!hasSpecialChar)
                {
                    return (false, "Password must contain at least one special character (e.g. @, #, $, %, !, &, *).", null);
                }

                // 2. Enforce unique email constraint (case-insensitive, including soft-deleted to avoid DB unique constraint conflict)
                var normalizedEmail = dto.Email.Trim().ToLower();
                var existingUser = await _context.Users
                    .IgnoreQueryFilters()
                    .AnyAsync(u => u.Email.ToLower() == normalizedEmail);
                if (existingUser)
                {
                    return (false, "A user with this email address already exists.", null);
                }

                // 3. Provision new User entity with salted BCrypt password hash
                var user = new User
                {
                    FullName = dto.FullName.Trim(),
                    Email = normalizedEmail,
                    PasswordHash = PasswordHasher.HashPassword(dto.Password),
                    Role = dto.Role,
                    Remarks = dto.Remarks?.Trim(),
                    Status = 1,
                    IsDeleted = false,
                    CreatedDate = DateTime.UtcNow
                };

                _context.Users.Add(user);
                await _context.SaveChangesAsync();

                // 4. Generate signed JWT bearer token
                var (token, expiration) = _jwtHelper.GenerateToken(user);

                var response = new AuthResponseDto
                {
                    Token = token,
                    Expiration = expiration,
                    User = new UserDto
                    {
                        Id = user.Id,
                        FullName = user.FullName,
                        Email = user.Email,
                        Role = user.Role.ToString(),
                        CreatedAt = user.CreatedDate,
                        Remarks = user.Remarks,
                        Status = user.Status,
                        IsDeleted = user.IsDeleted,
                        LastUpdatedDate = user.LastUpdatedDate,
                        CreatedById = user.CreatedById
                    }
                };

                return (true, "Registration successful.", response);
            }
            catch (Exception ex)
            {
                return (false, $"Registration failed: {ex.Message}", null);
            }
        }

        /// <summary>
        /// Authenticates user credentials and returns session authorization token.
        /// </summary>
        public async Task<(bool Success, string Message, AuthResponseDto? Data)> LoginAsync(LoginRequestDto dto)
        {
            var normalizedEmail = dto.Email.Trim().ToLower();
            var user = await _context.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.Email.ToLower() == normalizedEmail);

            if (user == null || !PasswordHasher.VerifyPassword(dto.Password, user.PasswordHash))
            {
                return (false, "Invalid email or password.", null);
            }

            var (token, expiration) = _jwtHelper.GenerateToken(user);

            var response = new AuthResponseDto
            {
                Token = token,
                Expiration = expiration,
                User = new UserDto
                {
                    Id = user.Id,
                    FullName = user.FullName,
                    Email = user.Email,
                    Role = user.Role.ToString(),
                    CreatedAt = user.CreatedDate,
                    Remarks = user.Remarks,
                    Status = user.Status,
                    IsDeleted = user.IsDeleted,
                    LastUpdatedDate = user.LastUpdatedDate,
                    CreatedById = user.CreatedById
                }
            };

            return (true, "Login successful.", response);
        }

        /// <summary>
        /// Retrieves a user profile by unique identifier using non-tracking query.
        /// </summary>
        public async Task<UserDto?> GetUserByIdAsync(int id)
        {
            var user = await _context.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.Id == id);

            if (user == null) return null;

            return new UserDto
            {
                Id = user.Id,
                FullName = user.FullName,
                Email = user.Email,
                Role = user.Role.ToString(),
                CreatedAt = user.CreatedDate,
                Remarks = user.Remarks,
                Status = user.Status,
                IsDeleted = user.IsDeleted,
                LastUpdatedDate = user.LastUpdatedDate,
                CreatedById = user.CreatedById
            };
        }

        /// <summary>
        /// Retrieves all active users for assignment pickers using high-performance non-tracking projection.
        /// </summary>
        public async Task<List<UserDto>> GetAllUsersAsync()
        {
            return await _context.Users
                .AsNoTracking()
                .OrderBy(u => u.FullName)
                .Select(u => new UserDto
                {
                    Id = u.Id,
                    FullName = u.FullName,
                    Email = u.Email,
                    Role = u.Role.ToString(),
                    CreatedAt = u.CreatedDate,
                    Remarks = u.Remarks,
                    Status = u.Status,
                    IsDeleted = u.IsDeleted,
                    LastUpdatedDate = u.LastUpdatedDate,
                    CreatedById = u.CreatedById
                })
                .ToListAsync();
        }
    }
}
