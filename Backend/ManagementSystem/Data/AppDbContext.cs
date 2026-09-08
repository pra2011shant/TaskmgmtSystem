using ManagementSystem.Models;
using Microsoft.EntityFrameworkCore;

namespace ManagementSystem.Data
{
    /// <summary>
    /// Entity Framework Core Database Context configuring tables, relational integrity,
    /// high-performance indexes, and global soft-delete query filters.
    /// </summary>
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        // =========================================================================
        // Database Tables (DbSets)
        // =========================================================================
        public DbSet<User> Users => Set<User>();
        public DbSet<Team> Teams => Set<Team>();
        public DbSet<TeamMember> TeamMembers => Set<TeamMember>();
        public DbSet<TaskItem> Tasks => Set<TaskItem>();
        public DbSet<TaskComment> Comments => Set<TaskComment>();
        public DbSet<Notification> Notifications => Set<Notification>();
        public DbSet<SubTask> SubTasks => Set<SubTask>();
        public DbSet<TaskAttachment> TaskAttachments => Set<TaskAttachment>();
        public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
        public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
        public DbSet<RolePermission> RolePermissions => Set<RolePermission>();

        /// <summary>
        /// Configures database schema constraints, foreign key cascades, unique indexes,
        /// and global query filters for automatic soft deletion.
        /// </summary>
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // 1. User Entity
            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();

            modelBuilder.Entity<User>()
                .HasQueryFilter(u => !u.IsDeleted);

            // 2. Team Entity
            modelBuilder.Entity<Team>()
                .HasOne(t => t.Manager)
                .WithMany(u => u.ManagedTeams)
                .HasForeignKey(t => t.ManagerId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<Team>()
                .HasQueryFilter(t => !t.IsDeleted);

            // 3. TeamMember Entity
            modelBuilder.Entity<TeamMember>()
                .HasIndex(tm => new { tm.TeamId, tm.UserId })
                .IsUnique();

            modelBuilder.Entity<TeamMember>()
                .HasOne(tm => tm.Team)
                .WithMany(t => t.Members)
                .HasForeignKey(tm => tm.TeamId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<TeamMember>()
                .HasOne(tm => tm.User)
                .WithMany(u => u.TeamMemberships)
                .HasForeignKey(tm => tm.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<TeamMember>()
                .HasQueryFilter(tm => !tm.IsDeleted);

            // 4. TaskItem Entity
            modelBuilder.Entity<TaskItem>()
                .HasOne(t => t.Team)
                .WithMany(tm => tm.Tasks)
                .HasForeignKey(t => t.TeamId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<TaskItem>()
                .HasOne(t => t.AssignedToUser)
                .WithMany(u => u.AssignedTasks)
                .HasForeignKey(t => t.AssignedToUserId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<TaskItem>()
                .HasOne(t => t.CreatedByUser)
                .WithMany(u => u.CreatedTasks)
                .HasForeignKey(t => t.CreatedById)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<TaskItem>()
                .HasQueryFilter(t => !t.IsDeleted);

            // 5. SubTask Entity
            modelBuilder.Entity<SubTask>()
                .HasOne(st => st.Task)
                .WithMany(t => t.SubTasks)
                .HasForeignKey(st => st.TaskId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<SubTask>()
                .HasQueryFilter(st => !st.IsDeleted);

            // 6. TaskAttachment Entity
            modelBuilder.Entity<TaskAttachment>()
                .HasOne(ta => ta.Task)
                .WithMany(t => t.Attachments)
                .HasForeignKey(ta => ta.TaskId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<TaskAttachment>()
                .HasOne(ta => ta.UploadedByUser)
                .WithMany()
                .HasForeignKey(ta => ta.UploadedById)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<TaskAttachment>()
                .HasQueryFilter(ta => !ta.IsDeleted);

            // 7. TaskComment Entity
            modelBuilder.Entity<TaskComment>()
                .HasOne(c => c.Task)
                .WithMany(t => t.Comments)
                .HasForeignKey(c => c.TaskId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<TaskComment>()
                .HasOne(c => c.User)
                .WithMany(u => u.Comments)
                .HasForeignKey(c => c.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<TaskComment>()
                .HasOne(c => c.ParentComment)
                .WithMany(c => c.Replies)
                .HasForeignKey(c => c.ParentCommentId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<TaskComment>()
                .HasQueryFilter(c => !c.IsDeleted);

            // 8. Notification Entity
            modelBuilder.Entity<Notification>()
                .HasOne(n => n.User)
                .WithMany(u => u.Notifications)
                .HasForeignKey(n => n.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Notification>()
                .HasQueryFilter(n => !n.IsDeleted);

            // 9. RefreshToken Entity
            modelBuilder.Entity<RefreshToken>()
                .HasOne(rt => rt.User)
                .WithMany(u => u.RefreshTokens)
                .HasForeignKey(rt => rt.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // 10. AuditLog Indexes
            modelBuilder.Entity<AuditLog>()
                .HasIndex(a => new { a.EntityName, a.EntityId });

            modelBuilder.Entity<AuditLog>()
                .HasIndex(a => a.Timestamp);
        }
    }
}
