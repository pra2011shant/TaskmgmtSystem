using ManagementSystem.Helpers;
using Xunit;

namespace ManagementSystem.Tests
{
    public class PasswordHasherTests
    {
        [Fact]
        public void HashPassword_ShouldReturnNonEmptySaltedHash()
        {
            // Arrange
            var password = "StrongPassword@123";

            // Act
            var hash = PasswordHasher.HashPassword(password);

            // Assert
            Assert.False(string.IsNullOrWhiteSpace(hash));
            Assert.StartsWith("$2", hash); // BCrypt standard prefix
        }

        [Fact]
        public void VerifyPassword_WithCorrectPassword_ShouldReturnTrue()
        {
            // Arrange
            var password = "Secure@Password2026";
            var hash = PasswordHasher.HashPassword(password);

            // Act
            var isValid = PasswordHasher.VerifyPassword(password, hash);

            // Assert
            Assert.True(isValid);
        }

        [Fact]
        public void VerifyPassword_WithIncorrectPassword_ShouldReturnFalse()
        {
            // Arrange
            var password = "Secure@Password2026";
            var wrongPassword = "WrongPassword@999";
            var hash = PasswordHasher.HashPassword(password);

            // Act
            var isValid = PasswordHasher.VerifyPassword(wrongPassword, hash);

            // Assert
            Assert.False(isValid);
        }
    }
}
