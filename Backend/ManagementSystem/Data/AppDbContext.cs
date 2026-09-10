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
        public DbSet<Project> Projects => Set<Project>();
        public DbSet<Milestone> Milestones => Set<Milestone>();
        public DbSet<TaskItem> Tasks => Set<TaskItem>();
        public DbSet<TaskComment> Comments => Set<TaskComment>();
        public DbSet<Notification> Notifications => Set<Notification>();
        public DbSet<SubTask> SubTasks => Set<SubTask>();
        public DbSet<TaskAttachment> TaskAttachments => Set<TaskAttachment>();
        public DbSet<TaskDependency> TaskDependencies => Set<TaskDependency>();
        public DbSet<TaskWatcher> TaskWatchers => Set<TaskWatcher>();
        public DbSet<TaskTimeLog> TaskTimeLogs => Set<TaskTimeLog>();
        public DbSet<TaskTemplate> TaskTemplates => Set<TaskTemplate>();
        public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
        public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
        public DbSet<RolePermission> RolePermissions => Set<RolePermission>();
        public DbSet<TaskView> TaskViews => Set<TaskView>();

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

            // 4. Project Entity
            modelBuilder.Entity<Project>()
                .HasIndex(p => p.ProjectKey)
                .IsUnique();

            modelBuilder.Entity<Project>()
                .HasOne(p => p.Manager)
                .WithMany()
                .HasForeignKey(p => p.ManagerId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<Project>()
                .HasQueryFilter(p => !p.IsDeleted);

            // 5. Milestone Entity
            modelBuilder.Entity<Milestone>()
                .HasOne(m => m.Project)
                .WithMany(p => p.Milestones)
                .HasForeignKey(m => m.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Milestone>()
                .HasQueryFilter(m => !m.IsDeleted);

            // 6. TaskItem Entity
            modelBuilder.Entity<TaskItem>()
                .HasOne(t => t.Project)
                .WithMany(p => p.Tasks)
                .HasForeignKey(t => t.ProjectId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<TaskItem>()
                .HasOne(t => t.Milestone)
                .WithMany(m => m.Tasks)
                .HasForeignKey(t => t.MilestoneId)
                .OnDelete(DeleteBehavior.SetNull);

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

            // 7. SubTask Entity
            modelBuilder.Entity<SubTask>()
                .HasOne(st => st.Task)
                .WithMany(t => t.SubTasks)
                .HasForeignKey(st => st.TaskId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<SubTask>()
                .HasQueryFilter(st => !st.IsDeleted);

            // 8. TaskAttachment Entity
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

            // 9. TaskDependency Entity
            modelBuilder.Entity<TaskDependency>()
                .HasOne(td => td.Task)
                .WithMany(t => t.Dependencies)
                .HasForeignKey(td => td.TaskId)
                .IsRequired(false)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<TaskDependency>()
                .HasOne(td => td.DependsOnTask)
                .WithMany()
                .HasForeignKey(td => td.DependsOnTaskId)
                .IsRequired(false)
                .OnDelete(DeleteBehavior.Restrict);

            // 10. TaskWatcher Entity
            modelBuilder.Entity<TaskWatcher>()
                .HasIndex(tw => new { tw.TaskId, tw.UserId })
                .IsUnique();

            modelBuilder.Entity<TaskWatcher>()
                .HasOne(tw => tw.Task)
                .WithMany(t => t.Watchers)
                .HasForeignKey(tw => tw.TaskId)
                .IsRequired(false)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<TaskWatcher>()
                .HasOne(tw => tw.User)
                .WithMany()
                .HasForeignKey(tw => tw.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // 11. TaskTimeLog Entity
            modelBuilder.Entity<TaskTimeLog>()
                .HasOne(tl => tl.Task)
                .WithMany(t => t.TimeLogs)
                .HasForeignKey(tl => tl.TaskId)
                .IsRequired(false)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<TaskTimeLog>()
                .HasOne(tl => tl.User)
                .WithMany(u => u.TimeLogs)
                .HasForeignKey(tl => tl.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            // 12. TaskComment Entity
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

            // 13. Notification Entity
            modelBuilder.Entity<Notification>()
                .HasOne(n => n.User)
                .WithMany(u => u.Notifications)
                .HasForeignKey(n => n.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Notification>()
                .HasQueryFilter(n => !n.IsDeleted);

            // 14. RefreshToken Entity
            modelBuilder.Entity<RefreshToken>()
                .HasOne(rt => rt.User)
                .WithMany(u => u.RefreshTokens)
                .HasForeignKey(rt => rt.UserId)
                .IsRequired(false)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<RefreshToken>()
                .HasQueryFilter(rt => !rt.IsDeleted);

            // 15. RolePermission Entity
            modelBuilder.Entity<RolePermission>()
                .HasQueryFilter(rp => !rp.IsDeleted);

            // 16. AuditLog Indexes
            modelBuilder.Entity<AuditLog>()
                .HasIndex(a => new { a.EntityName, a.EntityId });

            modelBuilder.Entity<AuditLog>()
                .HasIndex(a => a.Timestamp);

            // 17. TaskView Entity
            modelBuilder.Entity<TaskView>()
                .HasOne(tv => tv.Task)
                .WithMany()
                .HasForeignKey(tv => tv.TaskId)
                .IsRequired(false)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<TaskView>()
                .HasOne(tv => tv.User)
                .WithMany()
                .HasForeignKey(tv => tv.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<TaskView>()
                .HasIndex(tv => new { tv.TaskId, tv.UserId });
        }
    }
}
