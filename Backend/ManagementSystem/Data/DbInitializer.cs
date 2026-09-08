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
        /// Seeds administrator accounts, departments, sample tasks, subtasks, permissions and system alerts upon first startup.
        /// </summary>
        public static async Task InitializeAsync(AppDbContext context, ILogger logger)
        {
            try
            {
                // Ensure relational schema exists
                await context.Database.EnsureCreatedAsync();

                // Seed Role Permissions if not present
                if (!await context.RolePermissions.AnyAsync())
                {
                    var managerPerms = new[]
                    {
                        AppPermissions.TaskCreate, AppPermissions.TaskView, AppPermissions.TaskEdit,
                        AppPermissions.TaskAssign, AppPermissions.TaskChangeStatus,
                        AppPermissions.TeamView, AppPermissions.TeamEdit, AppPermissions.TeamManageMembers,
                        AppPermissions.UserView, AppPermissions.ReportsExport
                    };

                    foreach (var p in managerPerms)
                    {
                        context.RolePermissions.Add(new RolePermission { Role = UserRole.Manager, Permission = p, IsGranted = true });
                    }

                    var userPerms = new[]
                    {
                        AppPermissions.TaskView, AppPermissions.TaskChangeStatus,
                        AppPermissions.TeamView, AppPermissions.UserView
                    };

                    foreach (var p in userPerms)
                    {
                        context.RolePermissions.Add(new RolePermission { Role = UserRole.User, Permission = p, IsGranted = true });
                    }

                    await context.SaveChangesAsync();
                }

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
                    Department = "Executive IT",
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
                    Department = "Engineering",
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
                    Department = "Engineering",
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
                    Department = "Design",
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
                    Department = "Quality Assurance",
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
                    CreatedById = admin.Id,
                    CreatedDate = DateTime.UtcNow
                };

                var designTeam = new Team
                {
                    Name = "UI/UX & Product Design",
                    Description = "Design systems, interactive prototypes, and accessible user experiences.",
                    ManagerId = manager.Id,
                    Status = 1,
                    IsDeleted = false,
                    CreatedById = admin.Id,
                    CreatedDate = DateTime.UtcNow
                };

                var qaTeam = new Team
                {
                    Name = "Quality Assurance & DevOps",
                    Description = "Automated integration pipelines, load testing, and release certification.",
                    ManagerId = manager.Id,
                    Status = 1,
                    IsDeleted = false,
                    CreatedById = admin.Id,
                    CreatedDate = DateTime.UtcNow
                };

                context.Teams.AddRange(engineeringTeam, designTeam, qaTeam);
                await context.SaveChangesAsync();

                // =====================================================================
                // 3. TEAM MEMBERSHIP ASSOCIATIONS
                // =====================================================================
                context.TeamMembers.AddRange(
                    new TeamMember { TeamId = engineeringTeam.Id, UserId = user1.Id, CreatedById = admin.Id, CreatedDate = DateTime.UtcNow },
                    new TeamMember { TeamId = designTeam.Id, UserId = user2.Id, CreatedById = admin.Id, CreatedDate = DateTime.UtcNow },
                    new TeamMember { TeamId = qaTeam.Id, UserId = user3.Id, CreatedById = admin.Id, CreatedDate = DateTime.UtcNow }
                );
                await context.SaveChangesAsync();

                // =====================================================================
                // 3.5 SEED SAMPLE PROJECTS & MILESTONES
                // =====================================================================
                var project1 = new Project
                {
                    ProjectKey = "WFP",
                    Name = "WorkFlow Pro Enterprise Core",
                    Description = "Next-generation enterprise task management and collaboration platform.",
                    TeamId = engineeringTeam.Id,
                    ManagerId = manager.Id,
                    Budget = 85000,
                    StartDate = DateTime.UtcNow.AddMonths(-1),
                    EndDate = DateTime.UtcNow.AddMonths(2),
                    ProjectStatus = 1,
                    CreatedById = admin.Id,
                    CreatedDate = DateTime.UtcNow.AddMonths(-1)
                };

                var project2 = new Project
                {
                    ProjectKey = "SEC",
                    Name = "Security & Compliance Hardening",
                    Description = "SOC2 audit preparation, penetration testing, and PBAC granular permissions.",
                    TeamId = engineeringTeam.Id,
                    ManagerId = manager.Id,
                    Budget = 45000,
                    StartDate = DateTime.UtcNow.AddDays(-15),
                    EndDate = DateTime.UtcNow.AddMonths(1),
                    ProjectStatus = 1,
                    CreatedById = admin.Id,
                    CreatedDate = DateTime.UtcNow.AddDays(-15)
                };

                context.Projects.AddRange(project1, project2);
                await context.SaveChangesAsync();

                var milestone1 = new Milestone
                {
                    ProjectId = project1.Id,
                    Title = "Phase 1: API Foundation & Architecture",
                    Description = "Core database schema, JWT auth, and repository services.",
                    DueDate = DateTime.UtcNow.AddDays(15),
                    ProgressPercentage = 75,
                    MilestoneStatus = 2,
                    CreatedById = manager.Id,
                    CreatedDate = DateTime.UtcNow.AddDays(-10)
                };

                var milestone2 = new Milestone
                {
                    ProjectId = project1.Id,
                    Title = "Phase 2: Real-Time WebSockets & UI",
                    Description = "SignalR hub, live stopwatch, and Angular 19 signals UI.",
                    DueDate = DateTime.UtcNow.AddMonths(1),
                    ProgressPercentage = 40,
                    MilestoneStatus = 2,
                    CreatedById = manager.Id,
                    CreatedDate = DateTime.UtcNow.AddDays(-5)
                };

                context.Milestones.AddRange(milestone1, milestone2);
                await context.SaveChangesAsync();

                // =====================================================================
                // 4. SEED SAMPLE TASKS & SUBTASKS
                // =====================================================================
                var task1 = new TaskItem
                {
                    ProjectId = project1.Id,
                    MilestoneId = milestone1.Id,
                    Title = "Implement JWT & Refresh Token Authentication",
                    Description = "Configure ASP.NET Core JWT bearer authentication with silent refresh token rotation and BCrypt hashing.",
                    Status = TaskStatusEnum.InProgress,
                    Priority = TaskPriorityEnum.Critical,
                    Category = "Backend & Security",
                    Tags = "security,jwt,auth,api",
                    EstimatedHours = 12.0,
                    ActualHours = 8.5,
                    DueDate = DateTime.UtcNow.AddDays(2),
                    TeamId = engineeringTeam.Id,
                    AssignedToUserId = user1.Id,
                    CreatedById = manager.Id,
                    CreatedDate = DateTime.UtcNow.AddDays(-3)
                };

                var task2 = new TaskItem
                {
                    ProjectId = project1.Id,
                    MilestoneId = milestone2.Id,
                    Title = "Design Interactive Kanban Board UI",
                    Description = "Create modern drag-and-drop Kanban workflow columns with rich card badges, avatars, and animations.",
                    Status = TaskStatusEnum.Review,
                    Priority = TaskPriorityEnum.High,
                    Category = "Frontend Design",
                    Tags = "kanban,ui,angular,signals",
                    EstimatedHours = 16.0,
                    ActualHours = 14.0,
                    DueDate = DateTime.UtcNow.AddDays(1),
                    TeamId = designTeam.Id,
                    AssignedToUserId = user2.Id,
                    CreatedById = manager.Id,
                    CreatedDate = DateTime.UtcNow.AddDays(-4)
                };

                var task3 = new TaskItem
                {
                    ProjectId = project2.Id,
                    Title = "Setup Automated CI/CD Pipeline with GitHub Actions",
                    Description = "Configure continuous integration to compile .NET API, build Angular artifacts, and execute unit test suite.",
                    Status = TaskStatusEnum.ToDo,
                    Priority = TaskPriorityEnum.Medium,
                    Category = "DevOps & Cloud",
                    Tags = "cicd,github-actions,devops",
                    EstimatedHours = 8.0,
                    ActualHours = 0.0,
                    DueDate = DateTime.UtcNow.AddDays(5),
                    TeamId = qaTeam.Id,
                    AssignedToUserId = user3.Id,
                    CreatedById = admin.Id,
                    CreatedDate = DateTime.UtcNow.AddDays(-1)
                };

                context.Tasks.AddRange(task1, task2, task3);
                await context.SaveChangesAsync();

                // Seed sample TimeLog
                context.TaskTimeLogs.AddRange(
                    new TaskTimeLog
                    {
                        TaskId = task1.Id,
                        UserId = user1.Id,
                        StartTime = DateTime.UtcNow.AddHours(-3),
                        EndTime = DateTime.UtcNow.AddHours(-1),
                        DurationMinutes = 120,
                        Description = "JWT configuration & Token Validation middleware setup",
                        CreatedDate = DateTime.UtcNow
                    }
                );

                // Subtasks for Task 1
                context.SubTasks.AddRange(
                    new SubTask { TaskId = task1.Id, Title = "Create RefreshToken entity and migration", IsCompleted = true, SortOrder = 1, CreatedDate = DateTime.UtcNow },
                    new SubTask { TaskId = task1.Id, Title = "Implement token refresh endpoint in AuthController", IsCompleted = true, SortOrder = 2, CreatedDate = DateTime.UtcNow },
                    new SubTask { TaskId = task1.Id, Title = "Add Angular HTTP interceptor silent refresh", IsCompleted = false, SortOrder = 3, CreatedDate = DateTime.UtcNow }
                );

                // =====================================================================
                // 5. DISCUSSION COMMENTS
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
                    Content = "@Rahul Excellent progress! Ensure CORS headers and rate limiting middleware are validated.",
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
