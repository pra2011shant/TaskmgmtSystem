namespace ManagementSystem.Helpers
{
    public static class AppPermissions
    {
        // Task Permissions
        public const string TaskCreate = "Task.Create";
        public const string TaskView = "Task.View";
        public const string TaskEdit = "Task.Edit";
        public const string TaskDelete = "Task.Delete";
        public const string TaskAssign = "Task.Assign";
        public const string TaskChangeStatus = "Task.ChangeStatus";

        // Team Permissions
        public const string TeamCreate = "Team.Create";
        public const string TeamView = "Team.View";
        public const string TeamEdit = "Team.Edit";
        public const string TeamDelete = "Team.Delete";
        public const string TeamManageMembers = "Team.ManageMembers";

        // User Permissions
        public const string UserCreate = "User.Create";
        public const string UserView = "User.View";
        public const string UserEdit = "User.Edit";
        public const string UserDelete = "User.Delete";
        public const string UserManageRoles = "User.ManageRoles";

        // Reports & Audit
        public const string AuditView = "Audit.View";
        public const string ReportsExport = "Reports.Export";
        public const string SettingsManage = "Settings.Manage";

        public static readonly string[] All =
        [
            TaskCreate, TaskView, TaskEdit, TaskDelete, TaskAssign, TaskChangeStatus,
            TeamCreate, TeamView, TeamEdit, TeamDelete, TeamManageMembers,
            UserCreate, UserView, UserEdit, UserDelete, UserManageRoles,
            AuditView, ReportsExport, SettingsManage
        ];
    }
}
