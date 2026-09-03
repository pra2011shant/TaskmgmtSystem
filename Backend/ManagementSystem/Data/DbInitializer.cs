using ManagementSystem.Helpers;
using ManagementSystem.Models;
using Microsoft.EntityFrameworkCore;

namespace ManagementSystem.Data
{
    /// <summary>
    /// Database initializer handling automated schema validation and initial baseline data seeding.
    /// </summary>
    public static class DbInitializer
    {
        /// <summary>
        /// Seeds administrator accounts, departments, sample tasks, and system alerts upon first startup.
        /// </summary>
        public static async Task InitializeAsync(AppDbContext context, ILogger logger)
        {
            try
            {
                // Ensure relational schema exists
                await context.Database.EnsureCreatedAsync();

                // Skip seeding if database already contains users
                if (await context.Users.AnyAsync())
                {
                    return;
                }

                logger.LogInformation("Seeding database with default enterprise users, teams, and sample tasks...");

                // =====================================================================
                // 1. DEFAULT USER ACCOUNTS (Admin, Manager, Team Members)
                // =====================================================================
                var admin = new User
                {
                    FullName = "System Administrator",
                    Email = "admin@system.com",
                    PasswordHash = PasswordHasher.HashPassword("Admin@123"),
                    Role = UserRole.Admin,
                    Status = 1,
                    IsDeleted = false,
                    CreatedDate = DateTime.UtcNow
                };

                var manager = new User
                {
                    FullName = "Alex Morgan (Engineering Manager)",
                    Email = "manager@system.com",
                    PasswordHash = PasswordHasher.HashPassword("Manager@123"),
                    Role = UserRole.Manager,
                    Status = 1,
                    IsDeleted = false,
                    CreatedDate = DateTime.UtcNow
                };

                var user1 = new User
                {
                    FullName = "Rahul Sharma (Senior Backend Engineer)",
                    Email = "rahul@system.com",
                    PasswordHash = PasswordHasher.HashPassword("User@123"),
                    Role = UserRole.User,
                    Status = 1,
                    IsDeleted = false,
                    CreatedDate = DateTime.UtcNow
                };

                var user2 = new User
                {
                    FullName = "Priya Patel (UI/UX Designer)",
                    Email = "priya@system.com",
                    PasswordHash = PasswordHasher.HashPassword("User@123"),
                    Role = UserRole.User,
                    Status = 1,
                    IsDeleted = false,
                    CreatedDate = DateTime.UtcNow
                };

                var user3 = new User
                {
                    FullName = "John Doe (QA Automation Engineer)",
                    Email = "user@system.com",
                    PasswordHash = PasswordHasher.HashPassword("User@123"),
                    Role = UserRole.User,
                    Status = 1,
                    IsDeleted = false,
                    CreatedDate = DateTime.UtcNow
                };

                context.Users.AddRange(admin, manager, user1, user2, user3);
                await context.SaveChangesAsync();

                // =====================================================================
                // 2. DEFAULT ORGANIZATIONAL TEAMS
                // =====================================================================
                var engineeringTeam = new Team
                {
                    Name = "Engineering Team",
                    Description = "Core product architecture, scalable microservices, and database performance.",
                    ManagerId = manager.Id,
                    Status = 1,
                    IsDeleted = false,
                    CreatedDate = DateTime.UtcNow
                };

                var designTeam = new Team
                {
                    Name = "UI/UX & Design Systems",
                    Description = "Responsive web interfaces, Figma design systems, and user experience telemetry.",
                    ManagerId = manager.Id,
                    Status = 1,
                    IsDeleted = false,
                    CreatedDate = DateTime.UtcNow
                };

                context.Teams.AddRange(engineeringTeam, designTeam);
                await context.SaveChangesAsync();

                // =====================================================================
                // 3. TEAM MEMBERSHIP ROSTERS
                // =====================================================================
                var teamMembers = new List<TeamMember>
                {
                    new TeamMember { TeamId = engineeringTeam.Id, UserId = user1.Id, Status = 1, IsDeleted = false, CreatedDate = DateTime.UtcNow },
                    new TeamMember { TeamId = engineeringTeam.Id, UserId = user3.Id, Status = 1, IsDeleted = false, CreatedDate = DateTime.UtcNow },
                    new TeamMember { TeamId = designTeam.Id, UserId = user2.Id, Status = 1, IsDeleted = false, CreatedDate = DateTime.UtcNow }
                };

                context.TeamMembers.AddRange(teamMembers);
                await context.SaveChangesAsync();

                // =====================================================================
                // 4. SAMPLE WORK TASKS
                // =====================================================================
                var task1 = new TaskItem
                {
                    Title = "Build ASP.NET Core REST API Endpoints",
                    Description = "Implement secure JWT authentication, RBAC authorization, and Entity Framework Core repositories.",
                    Status = TaskStatusEnum.InProgress,
                    Priority = TaskPriorityEnum.High,
                    DueDate = DateTime.UtcNow.AddDays(3),
                    TeamId = engineeringTeam.Id,
                    AssignedToUserId = user1.Id,
                    CreatedById = manager.Id,
                    IsDeleted = false,
                    CreatedDate = DateTime.UtcNow.AddDays(-2)
                };

                var task2 = new TaskItem
                {
                    Title = "Design Responsive Glassmorphic Dashboard",
                    Description = "Create clean and accessible UI components with responsive grid, charts, and dark/light themes.",
                    Status = TaskStatusEnum.InProgress,
                    Priority = TaskPriorityEnum.Urgent,
                    DueDate = DateTime.UtcNow.AddDays(2),
                    TeamId = designTeam.Id,
                    AssignedToUserId = user2.Id,
                    CreatedById = manager.Id,
                    IsDeleted = false,
                    CreatedDate = DateTime.UtcNow.AddDays(-1)
                };

                var task3 = new TaskItem
                {
                    Title = "Write Unit & Integration Tests",
                    Description = "Verify authentication flows, task status transition, and role permission checks.",
                    Status = TaskStatusEnum.ToDo,
                    Priority = TaskPriorityEnum.Medium,
                    DueDate = DateTime.UtcNow.AddDays(7),
                    TeamId = engineeringTeam.Id,
                    AssignedToUserId = user3.Id,
                    CreatedById = admin.Id,
                    IsDeleted = false,
                    CreatedDate = DateTime.UtcNow
                };

                var task4 = new TaskItem
                {
                    Title = "Setup CI/CD Pipeline & Docker Architecture",
                    Description = "Configure multi-stage Dockerfiles and GitHub Actions workflow for automated testing.",
                    Status = TaskStatusEnum.Done,
                    Priority = TaskPriorityEnum.Low,
                    DueDate = DateTime.UtcNow.AddDays(-1),
                    TeamId = engineeringTeam.Id,
                    AssignedToUserId = user1.Id,
                    CreatedById = admin.Id,
                    IsDeleted = false,
                    CreatedDate = DateTime.UtcNow.AddDays(-5),
                    LastUpdatedDate = DateTime.UtcNow.AddDays(-1)
                };

                context.Tasks.AddRange(task1, task2, task3, task4);
                await context.SaveChangesAsync();

                // =====================================================================
                // 5. SAMPLE COLLABORATION COMMENTS
                // =====================================================================
                var comment1 = new TaskComment
                {
                    TaskId = task1.Id,
                    UserId = user1.Id,
                    Content = "JWT authentication and RBAC filters are verified. Database connection pooling active.",
                    Status = 1,
                    IsDeleted = false,
                    CreatedDate = DateTime.UtcNow.AddHours(-4)
                };

                var comment2 = new TaskComment
                {
                    TaskId = task1.Id,
                    UserId = manager.Id,
                    Content = "Excellent progress! Ensure CORS headers and rate limiting middleware are validated.",
                    Status = 1,
                    IsDeleted = false,
                    CreatedDate = DateTime.UtcNow.AddHours(-2)
                };

                context.Comments.AddRange(comment1, comment2);

                // =====================================================================
                // 6. INITIAL IN-APP NOTIFICATIONS
                // =====================================================================
                var notif1 = new Notification
                {
                    UserId = user1.Id,
                    Title = "Task Assigned",
                    Message = $"You have been assigned to task: '{task1.Title}' by {manager.FullName}",
                    Type = "TaskAssigned",
                    RelatedTaskId = task1.Id,
                    IsRead = false,
                    Status = 1,
                    IsDeleted = false,
                    CreatedDate = DateTime.UtcNow.AddDays(-2)
                };

                var notif2 = new Notification
                {
                    UserId = user2.Id,
                    Title = "Task Assigned",
                    Message = $"You have been assigned to task: '{task2.Title}' by {manager.FullName}",
                    Type = "TaskAssigned",
                    RelatedTaskId = task2.Id,
                    IsRead = false,
                    Status = 1,
                    IsDeleted = false,
                    CreatedDate = DateTime.UtcNow.AddDays(-1)
                };

                context.Notifications.AddRange(notif1, notif2);
                await context.SaveChangesAsync();

                logger.LogInformation("Database seeded successfully with default sample data.");
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "An error occurred while seeding the database.");
            }
        }
    }
}
