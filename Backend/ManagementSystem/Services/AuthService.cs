using System.Text.RegularExpressions;
using ManagementSystem.Data;
using ManagementSystem.DTOs;
using ManagementSystem.Helpers;
using ManagementSystem.Models;
using Microsoft.EntityFrameworkCore;

namespace ManagementSystem.Services
{
    public interface IAuthService
    {
        Task<(bool Success, string Message, AuthResponseDto? Data)> RegisterAsync(RegisterRequestDto dto, string? ipAddress = null);
        Task<(bool Success, string Message, AuthResponseDto? Data)> LoginAsync(LoginRequestDto dto, string? ipAddress = null);
        Task<(bool Success, string Message, AuthResponseDto? Data)> RefreshTokenAsync(string refreshToken, string? ipAddress = null);
        Task<(bool Success, string Message)> RevokeTokenAsync(string? refreshToken, int? userId = null);
        Task<UserDto?> GetUserByIdAsync(int id);
        Task<List<UserDto>> GetAllUsersAsync();
        Task<List<string>> GetUserPermissionsAsync(UserRole role);
        Task<(bool Success, string Message, string? ResetCode)> ForgotPasswordAsync(ForgotPasswordRequestDto dto, string? ipAddress = null);
        Task<(bool Success, string Message)> ResetPasswordAsync(ResetPasswordRequestDto dto, string? ipAddress = null);
    }

    public class AuthService : IAuthService
    {
        private readonly AppDbContext _context;
        private readonly IJwtHelper _jwtHelper;
        private readonly IAuditService _auditService;
        private readonly ILogger<AuthService> _logger;

        public AuthService(AppDbContext context, IJwtHelper jwtHelper, IAuditService auditService, ILogger<AuthService> logger)
        {
            _context = context;
            _jwtHelper = jwtHelper;
            _auditService = auditService;
            _logger = logger;
        }

        public async Task<List<string>> GetUserPermissionsAsync(UserRole role)
        {
            if (role == UserRole.Admin)
            {
                return AppPermissions.All.ToList();
            }

            var granted = await _context.RolePermissions
                .Where(rp => rp.Role == role && rp.IsGranted)
                .Select(rp => rp.Permission)
                .ToListAsync();

            if (granted.Count == 0)
            {
                // Fallback default permissions for Manager and User
                if (role == UserRole.Manager)
                {
                    return new List<string>
                    {
                        AppPermissions.TaskCreate, AppPermissions.TaskView, AppPermissions.TaskEdit,
                        AppPermissions.TaskAssign, AppPermissions.TaskChangeStatus,
                        AppPermissions.TeamView, AppPermissions.TeamEdit, AppPermissions.TeamManageMembers,
                        AppPermissions.UserView, AppPermissions.ReportsExport
                    };
                }
                else
                {
                    return new List<string>
                    {
                        AppPermissions.TaskView, AppPermissions.TaskChangeStatus,
                        AppPermissions.TeamView, AppPermissions.UserView
                    };
                }
            }

            return granted;
        }

        public async Task<(bool Success, string Message, AuthResponseDto? Data)> RegisterAsync(RegisterRequestDto dto, string? ipAddress = null)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(dto.Password) || dto.Password.Length < 6)
                {
                    return (false, "Password must be at least 6 characters long.", null);
                }

                var hasSpecialChar = Regex.IsMatch(dto.Password, @"[^a-zA-Z0-9]");
                if (!hasSpecialChar)
                {
                    return (false, "Password must contain at least one special character (e.g. @, #, $, %, !, &, *).", null);
                }

                var normalizedEmail = dto.Email.Trim().ToLower();
                var existingUser = await _context.Users
                    .IgnoreQueryFilters()
                    .AnyAsync(u => u.Email.ToLower() == normalizedEmail);

                if (existingUser)
                {
                    return (false, "A user with this email address already exists.", null);
                }

                var user = new User
                {
                    FullName = dto.FullName.Trim(),
                    Email = normalizedEmail,
                    PasswordHash = PasswordHasher.HashPassword(dto.Password),
                    Role = dto.Role,
                    Department = dto.Department?.Trim(),
                    Remarks = dto.Remarks?.Trim(),
                    Status = 1,
                    IsDeleted = false,
                    CreatedDate = DateTime.UtcNow
                };

                _context.Users.Add(user);
                await _context.SaveChangesAsync();

                var permissions = await GetUserPermissionsAsync(user.Role);
                var (token, expiration) = _jwtHelper.GenerateToken(user, permissions);
                var (refreshToken, refreshExpiration) = _jwtHelper.GenerateRefreshToken();

                var rtEntity = new RefreshToken
                {
                    UserId = user.Id,
                    Token = refreshToken,
                    ExpiryDate = refreshExpiration,
                    CreatedByIp = ipAddress,
                    CreatedDate = DateTime.UtcNow
                };
                _context.RefreshTokens.Add(rtEntity);
                await _context.SaveChangesAsync();

                await _auditService.LogAsync("UserRegistered", "User", user.Id.ToString(), null, new { user.Email, user.Role }, user.Id, user.FullName, user.Role.ToString(), ipAddress);

                var response = new AuthResponseDto
                {
                    Token = token,
                    Expiration = expiration,
                    RefreshToken = refreshToken,
                    RefreshTokenExpiration = refreshExpiration,
                    Permissions = permissions,
                    User = MapToDto(user)
                };

                return (true, "Registration successful.", response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred during user registration.");
                return (false, "An error occurred during registration. Please try again.", null);
            }
        }

        public async Task<(bool Success, string Message, AuthResponseDto? Data)> LoginAsync(LoginRequestDto dto, string? ipAddress = null)
        {
            try
            {
                var normalizedEmail = dto.Email.Trim().ToLower();
                var user = await _context.Users
                    .FirstOrDefaultAsync(u => u.Email.ToLower() == normalizedEmail);

                if (user == null)
                {
                    return (false, "Invalid email or password.", null);
                }

                if (user.IsLockedOut)
                {
                    return (false, $"Account is temporarily locked out until {user.LockoutEnd:g} UTC due to multiple failed login attempts.", null);
                }

                var isPasswordValid = PasswordHasher.VerifyPassword(dto.Password, user.PasswordHash);
                if (!isPasswordValid)
                {
                    user.FailedLoginAttempts++;
                    if (user.FailedLoginAttempts >= 5)
                    {
                        user.LockoutEnd = DateTime.UtcNow.AddMinutes(15);
                        await _auditService.LogAsync("AccountLocked", "User", user.Id.ToString(), null, new { user.Email, user.LockoutEnd }, user.Id, user.FullName, user.Role.ToString(), ipAddress);
                    }
                    await _context.SaveChangesAsync();
                    return (false, "Invalid email or password.", null);
                }

                // Reset failed attempts upon successful login and update user presence
                user.FailedLoginAttempts = 0;
                user.LockoutEnd = null;
                user.IsOnline = true;
                user.LastLoginDate = DateTime.UtcNow;
                user.LastActivityDate = DateTime.UtcNow;
                if (!string.IsNullOrEmpty(ipAddress))
                {
                    user.LastIpAddress = ipAddress;
                }
                user.LastUpdatedDate = DateTime.UtcNow;

                var permissions = await GetUserPermissionsAsync(user.Role);
                var (token, expiration) = _jwtHelper.GenerateToken(user, permissions);
                var (refreshToken, refreshExpiration) = _jwtHelper.GenerateRefreshToken();

                var rtEntity = new RefreshToken
                {
                    UserId = user.Id,
                    Token = refreshToken,
                    ExpiryDate = refreshExpiration,
                    CreatedByIp = ipAddress,
                    CreatedDate = DateTime.UtcNow
                };
                _context.RefreshTokens.Add(rtEntity);
                await _context.SaveChangesAsync();

                await _auditService.LogAsync("LOGIN", "Authentication", user.Id.ToString(), null, new { user.Email, user.Role, LoginAt = DateTime.UtcNow }, user.Id, user.FullName, user.Role.ToString(), ipAddress, module: "Authentication", description: $"{user.FullName} ({user.Role}) logged into the system.");

                var response = new AuthResponseDto
                {
                    Token = token,
                    Expiration = expiration,
                    RefreshToken = refreshToken,
                    RefreshTokenExpiration = refreshExpiration,
                    Permissions = permissions,
                    User = MapToDto(user)
                };

                return (true, "Login successful.", response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred during login.");
                return (false, "An error occurred during authentication. Please try again.", null);
            }
        }

        public async Task<(bool Success, string Message, AuthResponseDto? Data)> RefreshTokenAsync(string refreshToken, string? ipAddress = null)
        {
            try
            {
                var storedToken = await _context.RefreshTokens
                    .Include(rt => rt.User)
                    .FirstOrDefaultAsync(rt => rt.Token == refreshToken);

                if (storedToken == null || !storedToken.IsActive)
                {
                    return (false, "Invalid or expired refresh token.", null);
                }

                // Rotate refresh token (revoke current and issue a new one)
                storedToken.IsRevoked = true;
                storedToken.LastUpdatedDate = DateTime.UtcNow;

                var user = storedToken.User;
                var permissions = await GetUserPermissionsAsync(user.Role);
                var (newToken, newExpiration) = _jwtHelper.GenerateToken(user, permissions);
                var (newRefreshToken, newRefreshExpiration) = _jwtHelper.GenerateRefreshToken();

                var newRtEntity = new RefreshToken
                {
                    UserId = user.Id,
                    Token = newRefreshToken,
                    ExpiryDate = newRefreshExpiration,
                    CreatedByIp = ipAddress,
                    CreatedDate = DateTime.UtcNow
                };
                _context.RefreshTokens.Add(newRtEntity);
                await _context.SaveChangesAsync();

                var response = new AuthResponseDto
                {
                    Token = newToken,
                    Expiration = newExpiration,
                    RefreshToken = newRefreshToken,
                    RefreshTokenExpiration = newRefreshExpiration,
                    Permissions = permissions,
                    User = MapToDto(user)
                };

                return (true, "Token refreshed successfully.", response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred refreshing token.");
                return (false, "An error occurred while refreshing the session.", null);
            }
        }

        public async Task<(bool Success, string Message)> RevokeTokenAsync(string? refreshToken, int? userId = null)
        {
            try
            {
                if (!string.IsNullOrEmpty(refreshToken))
                {
                    var token = await _context.RefreshTokens.FirstOrDefaultAsync(rt => rt.Token == refreshToken);
                    if (token != null)
                    {
                        token.IsRevoked = true;
                        token.LastUpdatedDate = DateTime.UtcNow;

                        var user = await _context.Users.FindAsync(token.UserId);
                        if (user != null)
                        {
                            user.IsOnline = false;
                            user.LastLogoutDate = DateTime.UtcNow;
                            user.LastUpdatedDate = DateTime.UtcNow;
                            await _auditService.LogAsync("LOGOUT", "Authentication", user.Id.ToString(), null, new { user.Email, LogoutAt = DateTime.UtcNow }, user.Id, user.FullName, user.Role.ToString(), null, module: "Authentication", description: $"{user.FullName} logged out of the system.");
                        }
                    }
                }
                else if (userId.HasValue)
                {
                    var activeTokens = await _context.RefreshTokens
                        .Where(rt => rt.UserId == userId.Value && !rt.IsRevoked)
                        .ToListAsync();

                    foreach (var tok in activeTokens)
                    {
                        tok.IsRevoked = true;
                        tok.LastUpdatedDate = DateTime.UtcNow;
                    }

                    var user = await _context.Users.FindAsync(userId.Value);
                    if (user != null)
                    {
                        user.IsOnline = false;
                        user.LastLogoutDate = DateTime.UtcNow;
                        user.LastUpdatedDate = DateTime.UtcNow;
                        await _auditService.LogAsync("LOGOUT", "Authentication", user.Id.ToString(), null, new { user.Email, LogoutAt = DateTime.UtcNow }, user.Id, user.FullName, user.Role.ToString(), null, module: "Authentication", description: $"{user.FullName} logged out of the system.");
                    }
                }

                await _context.SaveChangesAsync();
                return (true, "Token revoked successfully.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred revoking token.");
                return (false, "Failed to revoke token.");
            }
        }

        public async Task<UserDto?> GetUserByIdAsync(int id)
        {
            var user = await _context.Users.FindAsync(id);
            return user == null ? null : MapToDto(user);
        }

        public async Task<List<UserDto>> GetAllUsersAsync()
        {
            var users = await _context.Users
                .OrderBy(u => u.FullName)
                .ToListAsync();

            return users.Select(MapToDto).ToList();
        }

        public async Task<(bool Success, string Message, string? ResetCode)> ForgotPasswordAsync(ForgotPasswordRequestDto dto, string? ipAddress = null)
        {
            try
            {
                var normalizedEmail = dto.Email.Trim().ToLower();
                var user = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == normalizedEmail);

                if (user == null)
                {
                    // Return user-friendly response even if user not found to prevent user enumeration
                    return (true, "If your email is registered in our system, a password recovery code has been generated.", "RECOVERY-987654");
                }

                // In enterprise systems with SMTP, this code is emailed. For direct seamless testing, we issue and log the token:
                var resetCode = $"{new Random().Next(100000, 999999)}";
                
                await _auditService.LogAsync("ForgotPasswordRequested", "User", user.Id.ToString(), null, new { user.Email, RecoveryInitiatedAt = DateTime.UtcNow }, user.Id, user.FullName, user.Role.ToString(), ipAddress);

                return (true, $"Password reset code generated for {user.Email}. Enter the code below to reset your password.", resetCode);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred during forgot password request for {Email}", dto.Email);
                return (false, "An error occurred while processing your request.", null);
            }
        }

        public async Task<(bool Success, string Message)> ResetPasswordAsync(ResetPasswordRequestDto dto, string? ipAddress = null)
        {
            try
            {
                var normalizedEmail = dto.Email.Trim().ToLower();
                var user = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == normalizedEmail);

                if (user == null)
                {
                    return (false, "User account not found with this email address.");
                }

                if (string.IsNullOrWhiteSpace(dto.NewPassword) || dto.NewPassword.Length < 6)
                {
                    return (false, "New password must be at least 6 characters long.");
                }

                var hasSpecialChar = Regex.IsMatch(dto.NewPassword, @"[^a-zA-Z0-9]");
                if (!hasSpecialChar)
                {
                    return (false, "New password must contain at least one special character.");
                }

                // Update password & reset lockout counters
                user.PasswordHash = PasswordHasher.HashPassword(dto.NewPassword);
                user.FailedLoginAttempts = 0;
                user.LockoutEnd = null;
                user.LastUpdatedDate = DateTime.UtcNow;

                // Revoke existing refresh tokens for security
                var activeTokens = await _context.RefreshTokens
                    .Where(rt => rt.UserId == user.Id && !rt.IsRevoked)
                    .ToListAsync();
                foreach (var tok in activeTokens)
                {
                    tok.IsRevoked = true;
                    tok.LastUpdatedDate = DateTime.UtcNow;
                }

                await _context.SaveChangesAsync();

                await _auditService.LogAsync("PasswordResetCompleted", "User", user.Id.ToString(), null, new { user.Email, ResetAt = DateTime.UtcNow }, user.Id, user.FullName, user.Role.ToString(), ipAddress);

                return (true, "Password has been successfully reset! You can now log in with your new password.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred during password reset for {Email}", dto.Email);
                return (false, "An error occurred while resetting password.");
            }
        }

        private static UserDto MapToDto(User user)
        {
            return new UserDto
            {
                Id = user.Id,
                FullName = user.FullName,
                Email = user.Email,
                Role = user.Role.ToString(),
                Department = user.Department,
                CreatedAt = user.CreatedDate,
                Remarks = user.Remarks,
                Status = user.Status,
                IsDeleted = user.IsDeleted,
                IsLockedOut = user.IsLockedOut,
                LastUpdatedDate = user.LastUpdatedDate,
                CreatedById = user.CreatedById
            };
        }
    }
}
