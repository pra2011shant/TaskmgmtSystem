using System.IdentityModel.Tokens.Jwt;
using ManagementSystem.Helpers;
using ManagementSystem.Models;
using Microsoft.Extensions.Configuration;
using Xunit;

namespace ManagementSystem.Tests
{
    public class JwtHelperTests
    {
        private readonly IJwtHelper _jwtHelper;

        public JwtHelperTests()
        {
            var inMemorySettings = new Dictionary<string, string?>
            {
                {"Jwt:Key", "SuperSecretUnitTestSigningKeyForJwtValidation2026!@#$%^&*"},
                {"Jwt:Issuer", "ManagementSystemAPI"},
                {"Jwt:Audience", "ManagementSystemClient"},
                {"Jwt:ExpiryMinutes", "60"}
            };

            var configuration = new ConfigurationBuilder()
                .AddInMemoryCollection(inMemorySettings)
                .Build();

            _jwtHelper = new JwtHelper(configuration);
        }

        [Fact]
        public void GenerateToken_ShouldReturnValidSignedJwt_ForAdminUser()
        {
            // Arrange
            var user = new User
            {
                Id = 1,
                FullName = "System Administrator",
                Email = "admin@system.com",
                Role = UserRole.Admin
            };

            // Act
            var (token, expiration) = _jwtHelper.GenerateToken(user);

            // Assert
            Assert.False(string.IsNullOrWhiteSpace(token));
            Assert.True(expiration > DateTime.UtcNow);

            var handler = new JwtSecurityTokenHandler();
            var jwtToken = handler.ReadJwtToken(token);

            Assert.Equal("ManagementSystemAPI", jwtToken.Issuer);
            Assert.Contains(jwtToken.Audiences, a => a == "ManagementSystemClient");
        }

        [Fact]
        public void GenerateToken_ShouldContainCorrectRoleClaim()
        {
            // Arrange
            var user = new User
            {
                Id = 2,
                FullName = "Alex Morgan",
                Email = "manager@system.com",
                Role = UserRole.Manager
            };

            // Act
            var (token, _) = _jwtHelper.GenerateToken(user);

            // Assert
            var handler = new JwtSecurityTokenHandler();
            var jwtToken = handler.ReadJwtToken(token);

            var roleClaim = jwtToken.Claims.FirstOrDefault(c => c.Type == "role" || c.Type.EndsWith("/role"));
            Assert.NotNull(roleClaim);
            Assert.Equal("Manager", roleClaim.Value);
        }
    }
}
