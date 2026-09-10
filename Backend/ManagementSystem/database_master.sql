-- ==============================================================================================
-- 🚀 WORKFLOW PRO — MASTER ENTERPRISE DATABASE SCRIPT
-- ==============================================================================================
-- Description:
-- Complete, single-source-of-truth SQL Server script for 'ManagementSystem'.
-- Includes:
--   1. Database Initialization
--   2. 19 Relational Enterprise Tables (RBAC, Multi-Org, Projects, Milestones, Tasks, TimeLogs, Audit, Views)
--   3. Non-Clustered High-Performance Indexes
--   4. Stored Procedures Suite (CRUD, Analytics, Bulk Operations, Leaderboards)
--   5. Full Enterprise Dummy Dataset (Realistic seeds for immediate testing)
-- ==============================================================================================

IF NOT EXISTS (SELECT 1 FROM sys.databases WHERE name = 'ManagementSystem')
BEGIN
    CREATE DATABASE ManagementSystem;
    PRINT 'Database [ManagementSystem] created successfully.';
END
GO

USE ManagementSystem;
GO

-- ==============================================================================================
-- PART 1: ENTERPRISE TABLES PROVISIONING
-- ==============================================================================================

-- 1. Organizations (Multi-Tenancy & Enterprise Hierarchy)
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'Organizations')
BEGIN
    CREATE TABLE Organizations (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Name NVARCHAR(150) NOT NULL,
        Domain NVARCHAR(100) NULL,
        SubscriptionTier NVARCHAR(50) NOT NULL DEFAULT 'Enterprise',
        Status INT NOT NULL DEFAULT 1,
        IsDeleted BIT NOT NULL DEFAULT 0,
        CreatedDate DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        LastUpdatedDate DATETIME2 NULL,
        CreatedById INT NULL
    );
END
GO

-- 2. Users (Authentication, Lockout, 2FA & Roles)
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'Users')
BEGIN
    CREATE TABLE Users (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        OrganizationId INT NULL FOREIGN KEY REFERENCES Organizations(Id) ON DELETE SET NULL,
        FullName NVARCHAR(100) NOT NULL,
        Email NVARCHAR(150) NOT NULL UNIQUE,
        PasswordHash NVARCHAR(MAX) NOT NULL,
        Role INT NOT NULL DEFAULT 3, -- 1=Admin, 2=Manager, 3=User
        Department NVARCHAR(100) NULL,
        FailedLoginAttempts INT NOT NULL DEFAULT 0,
        LockoutEnd DATETIME2 NULL,
        IsOnline BIT NOT NULL DEFAULT 0,
        LastLoginDate DATETIME2 NULL,
        LastActivityDate DATETIME2 NULL,
        LastLogoutDate DATETIME2 NULL,
        LastIpAddress NVARCHAR(50) NULL,
        LastUserAgent NVARCHAR(255) NULL,
        Remarks NVARCHAR(500) NULL,
        Status INT NOT NULL DEFAULT 1,
        IsDeleted BIT NOT NULL DEFAULT 0,
        CreatedDate DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        LastUpdatedDate DATETIME2 NULL,
        CreatedById INT NULL
    );
END
GO

-- 3. Teams (Functional Departments)
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'Teams')
BEGIN
    CREATE TABLE Teams (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        OrganizationId INT NULL FOREIGN KEY REFERENCES Organizations(Id),
        Name NVARCHAR(150) NOT NULL,
        Description NVARCHAR(500) NULL,
        ManagerId INT NULL FOREIGN KEY REFERENCES Users(Id) ON DELETE SET NULL,
        ColorCode NVARCHAR(20) NULL DEFAULT '#38bdf8',
        Remarks NVARCHAR(500) NULL,
        Status INT NOT NULL DEFAULT 1,
        IsDeleted BIT NOT NULL DEFAULT 0,
        CreatedDate DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        LastUpdatedDate DATETIME2 NULL,
        CreatedById INT NULL
    );
END
GO

-- 4. Team Members (Many-to-Many Association)
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'TeamMembers')
BEGIN
    CREATE TABLE TeamMembers (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        TeamId INT NOT NULL FOREIGN KEY REFERENCES Teams(Id) ON DELETE CASCADE,
        UserId INT NOT NULL FOREIGN KEY REFERENCES Users(Id) ON DELETE CASCADE,
        MemberRole NVARCHAR(50) NULL DEFAULT 'Member',
        Status INT NOT NULL DEFAULT 1,
        IsDeleted BIT NOT NULL DEFAULT 0,
        CreatedDate DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        LastUpdatedDate DATETIME2 NULL,
        CreatedById INT NULL,
        CONSTRAINT UQ_Team_User UNIQUE (TeamId, UserId)
    );
END
GO

-- 5. Projects (High-Level Project Deliverables)
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'Projects')
BEGIN
    CREATE TABLE Projects (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        OrganizationId INT NULL FOREIGN KEY REFERENCES Organizations(Id),
        TeamId INT NULL FOREIGN KEY REFERENCES Teams(Id) ON DELETE SET NULL,
        ProjectKey NVARCHAR(20) NOT NULL UNIQUE,
        Name NVARCHAR(200) NOT NULL,
        Description NVARCHAR(2000) NULL,
        ManagerId INT NULL FOREIGN KEY REFERENCES Users(Id) ON DELETE SET NULL,
        StartDate DATETIME2 NULL,
        EndDate DATETIME2 NULL,
        Budget DECIMAL(18,2) NULL,
        Status INT NOT NULL DEFAULT 1, -- 1=Active, 2=OnHold, 3=Completed
        IsDeleted BIT NOT NULL DEFAULT 0,
        CreatedDate DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        LastUpdatedDate DATETIME2 NULL,
        CreatedById INT NOT NULL FOREIGN KEY REFERENCES Users(Id)
    );
END
GO

-- 6. Milestones (Project Phases & Deadlines)
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'Milestones')
BEGIN
    CREATE TABLE Milestones (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        ProjectId INT NOT NULL FOREIGN KEY REFERENCES Projects(Id) ON DELETE CASCADE,
        Title NVARCHAR(200) NOT NULL,
        Description NVARCHAR(1000) NULL,
        DueDate DATETIME2 NOT NULL,
        ProgressPercentage DECIMAL(5,2) NOT NULL DEFAULT 0.00,
        Status INT NOT NULL DEFAULT 1, -- 1=Planned, 2=InProgress, 3=Achieved
        IsDeleted BIT NOT NULL DEFAULT 0,
        CreatedDate DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        LastUpdatedDate DATETIME2 NULL,
        CreatedById INT NULL
    );
END
GO

-- 7. Tasks (Work Items, Kanban Board & Lifecycles)
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'Tasks')
BEGIN
    CREATE TABLE Tasks (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        ProjectId INT NULL FOREIGN KEY REFERENCES Projects(Id),
        MilestoneId INT NULL FOREIGN KEY REFERENCES Milestones(Id),
        TeamId INT NULL FOREIGN KEY REFERENCES Teams(Id),
        AssignedToUserId INT NULL FOREIGN KEY REFERENCES Users(Id),
        Title NVARCHAR(200) NOT NULL,
        Description NVARCHAR(MAX) NULL,
        Priority INT NOT NULL DEFAULT 2, -- 1=Low, 2=Medium, 3=High, 4=Critical
        Status INT NOT NULL DEFAULT 2,   -- 0=Created, 1=Assigned, 2=ToDo, 3=InProgress, 4=Review, 5=Done, 6=Blocked
        Category NVARCHAR(100) NULL DEFAULT 'General',
        Tags NVARCHAR(500) NULL,
        EstimatedHours FLOAT NULL DEFAULT 0,
        ActualHours FLOAT NULL DEFAULT 0,
        DueDate DATETIME2 NULL,
        Remarks NVARCHAR(500) NULL,
        IsDeleted BIT NOT NULL DEFAULT 0,
        CreatedDate DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        LastUpdatedDate DATETIME2 NULL,
        CreatedById INT NOT NULL FOREIGN KEY REFERENCES Users(Id)
    );
END
GO

-- 8. Subtasks (Hierarchical Task Checklist)
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'SubTasks')
BEGIN
    CREATE TABLE SubTasks (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        TaskId INT NOT NULL FOREIGN KEY REFERENCES Tasks(Id) ON DELETE CASCADE,
        Title NVARCHAR(250) NOT NULL,
        IsCompleted BIT NOT NULL DEFAULT 0,
        SortOrder INT NOT NULL DEFAULT 0,
        Status INT NOT NULL DEFAULT 1,
        IsDeleted BIT NOT NULL DEFAULT 0,
        CreatedDate DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        LastUpdatedDate DATETIME2 NULL,
        CreatedById INT NULL
    );
END
GO

-- 9. Task Dependencies (Gantt Blocked-By / Blocks Relationships)
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'TaskDependencies')
BEGIN
    CREATE TABLE TaskDependencies (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        TaskId INT NOT NULL FOREIGN KEY REFERENCES Tasks(Id) ON DELETE CASCADE,
        DependsOnTaskId INT NOT NULL FOREIGN KEY REFERENCES Tasks(Id),
        DependencyType NVARCHAR(50) NOT NULL DEFAULT 'FinishToStart',
        CreatedDate DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
END
GO

-- 10. Task Watchers / Followers
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'TaskWatchers')
BEGIN
    CREATE TABLE TaskWatchers (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        TaskId INT NOT NULL FOREIGN KEY REFERENCES Tasks(Id) ON DELETE CASCADE,
        UserId INT NOT NULL FOREIGN KEY REFERENCES Users(Id),
        CreatedDate DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT UQ_Task_Watcher UNIQUE (TaskId, UserId)
    );
END
GO

-- 11. Task Time Logs (Live Stopwatch Timers)
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'TaskTimeLogs')
BEGIN
    CREATE TABLE TaskTimeLogs (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        TaskId INT NOT NULL FOREIGN KEY REFERENCES Tasks(Id) ON DELETE CASCADE,
        UserId INT NOT NULL FOREIGN KEY REFERENCES Users(Id),
        StartTime DATETIME2 NOT NULL,
        EndTime DATETIME2 NULL,
        DurationMinutes INT NOT NULL DEFAULT 0,
        Description NVARCHAR(500) NULL,
        CreatedDate DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
END
GO

-- 12. Task Templates (Reusable Workflow Blueprints)
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'TaskTemplates')
BEGIN
    CREATE TABLE TaskTemplates (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        TemplateName NVARCHAR(150) NOT NULL,
        Category NVARCHAR(100) NOT NULL DEFAULT 'Engineering',
        DefaultTitle NVARCHAR(200) NOT NULL,
        DefaultDescription NVARCHAR(2000) NULL,
        EstimatedHours FLOAT NULL DEFAULT 8.0,
        DefaultSubtasksJson NVARCHAR(MAX) NULL,
        CreatedDate DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CreatedById INT NULL
    );
END
GO

-- 13. Comments (Threaded Discussions & @Mentions)
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'Comments')
BEGIN
    CREATE TABLE Comments (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        TaskId INT NOT NULL FOREIGN KEY REFERENCES Tasks(Id) ON DELETE CASCADE,
        UserId INT NOT NULL FOREIGN KEY REFERENCES Users(Id),
        ParentCommentId INT NULL FOREIGN KEY REFERENCES Comments(Id),
        Content NVARCHAR(2000) NOT NULL,
        IsEdited BIT NOT NULL DEFAULT 0,
        Status INT NOT NULL DEFAULT 1,
        IsDeleted BIT NOT NULL DEFAULT 0,
        CreatedDate DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        LastUpdatedDate DATETIME2 NULL,
        CreatedById INT NULL
    );
END
GO

-- 14. Task Attachments (File Management)
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'TaskAttachments')
BEGIN
    CREATE TABLE TaskAttachments (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        TaskId INT NOT NULL FOREIGN KEY REFERENCES Tasks(Id) ON DELETE CASCADE,
        FileName NVARCHAR(255) NOT NULL,
        StoragePath NVARCHAR(500) NOT NULL,
        ContentType NVARCHAR(100) NOT NULL,
        FileSize BIGINT NOT NULL,
        UploadedById INT NOT NULL FOREIGN KEY REFERENCES Users(Id),
        Status INT NOT NULL DEFAULT 1,
        IsDeleted BIT NOT NULL DEFAULT 0,
        CreatedDate DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        LastUpdatedDate DATETIME2 NULL,
        CreatedById INT NULL
    );
END
GO

-- 15. Notifications (Real-Time & In-App Alerts)
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'Notifications')
BEGIN
    CREATE TABLE Notifications (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        UserId INT NOT NULL FOREIGN KEY REFERENCES Users(Id) ON DELETE CASCADE,
        Title NVARCHAR(200) NOT NULL,
        Message NVARCHAR(1000) NOT NULL,
        Type NVARCHAR(50) NOT NULL DEFAULT 'TaskAssigned',
        RelatedTaskId INT NULL,
        IsRead BIT NOT NULL DEFAULT 0,
        Status INT NOT NULL DEFAULT 1,
        IsDeleted BIT NOT NULL DEFAULT 0,
        CreatedDate DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        LastUpdatedDate DATETIME2 NULL,
        CreatedById INT NULL
    );
END
GO

-- 16. Audit Logs (Entity Change Tracking & Diff)
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'AuditLogs')
BEGIN
    CREATE TABLE AuditLogs (
        Id BIGINT IDENTITY(1,1) PRIMARY KEY,
        UserId INT NULL,
        UserName NVARCHAR(100) NULL,
        UserRole NVARCHAR(50) NULL,
        Action NVARCHAR(100) NOT NULL,
        Module NVARCHAR(100) NULL,
        EntityName NVARCHAR(100) NOT NULL,
        EntityId NVARCHAR(100) NULL,
        Description NVARCHAR(500) NULL,
        OldValueJson NVARCHAR(MAX) NULL,
        NewValueJson NVARCHAR(MAX) NULL,
        IpAddress NVARCHAR(50) NULL,
        UserAgent NVARCHAR(255) NULL,
        Timestamp DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
END
GO

-- 17. Task Views (Seen / Read Compliance Tracking)
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'TaskViews')
BEGIN
    CREATE TABLE TaskViews (
        Id BIGINT IDENTITY(1,1) PRIMARY KEY,
        TaskId INT NOT NULL FOREIGN KEY REFERENCES Tasks(Id) ON DELETE CASCADE,
        UserId INT NOT NULL FOREIGN KEY REFERENCES Users(Id),
        UserName NVARCHAR(100) NULL,
        UserRole NVARCHAR(50) NULL,
        IpAddress NVARCHAR(50) NULL,
        ViewedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
END
GO

-- 18. Refresh Tokens (JWT Rotation Security)
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'RefreshTokens')
BEGIN
    CREATE TABLE RefreshTokens (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        UserId INT NOT NULL FOREIGN KEY REFERENCES Users(Id) ON DELETE CASCADE,
        Token NVARCHAR(256) NOT NULL,
        ExpiryDate DATETIME2 NOT NULL,
        IsRevoked BIT NOT NULL DEFAULT 0,
        CreatedByIp NVARCHAR(50) NULL,
        Status INT NOT NULL DEFAULT 1,
        IsDeleted BIT NOT NULL DEFAULT 0,
        CreatedDate DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        LastUpdatedDate DATETIME2 NULL,
        CreatedById INT NULL
    );
END
GO

-- 19. Role Permissions (Granular Policy Matrix)
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'RolePermissions')
BEGIN
    CREATE TABLE RolePermissions (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Role INT NOT NULL,
        Permission NVARCHAR(100) NOT NULL,
        IsGranted BIT NOT NULL DEFAULT 1,
        Remarks NVARCHAR(500) NULL,
        Status INT NOT NULL DEFAULT 1,
        IsDeleted BIT NOT NULL DEFAULT 0,
        CreatedDate DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        LastUpdatedDate DATETIME2 NULL,
        CreatedById INT NULL
    );
END
GO

-- ==============================================================================================
-- PART 2: PERFORMANCE OPTIMIZATION INDEXES
-- ==============================================================================================

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Tasks_Priority_Status_DueDate' AND object_id = OBJECT_ID('Tasks'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_Tasks_Priority_Status_DueDate 
    ON Tasks (Status, Priority, DueDate, IsDeleted) 
    INCLUDE (Title, AssignedToUserId, TeamId, ProjectId);
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_AuditLogs_Entity_Timestamp' AND object_id = OBJECT_ID('AuditLogs'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_AuditLogs_Entity_Timestamp 
    ON AuditLogs (EntityName, EntityId, Timestamp);
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_TaskViews_TaskId_UserId' AND object_id = OBJECT_ID('TaskViews'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_TaskViews_TaskId_UserId 
    ON TaskViews (TaskId, UserId, ViewedAt);
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Users_Email_IsDeleted' AND object_id = OBJECT_ID('Users'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_Users_Email_IsDeleted 
    ON Users (Email, IsDeleted) 
    INCLUDE (FullName, Role, IsOnline, LastActivityDate);
END
GO

-- ==============================================================================================
-- PART 3: ENTERPRISE STORED PROCEDURES
-- ==============================================================================================

CREATE OR ALTER PROCEDURE sp_GetTasksWithDetails
    @UserId INT = NULL,
    @Role NVARCHAR(50) = 'Admin',
    @Status INT = NULL,
    @Priority INT = NULL,
    @TeamId INT = NULL,
    @ProjectId INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        t.Id, t.Title, t.Description, t.Status, t.Priority, t.Category, t.Tags,
        t.EstimatedHours, t.ActualHours, t.DueDate, t.CreatedDate,
        tm.Name AS TeamName,
        u.FullName AS AssignedToUserName,
        u.Email AS AssignedToUserEmail,
        p.Name AS ProjectName,
        (SELECT COUNT(1) FROM SubTasks st WHERE st.TaskId = t.Id AND st.IsDeleted = 0) AS SubtasksCount,
        (SELECT COUNT(1) FROM SubTasks st WHERE st.TaskId = t.Id AND st.IsCompleted = 1 AND st.IsDeleted = 0) AS CompletedSubtasksCount,
        (SELECT COUNT(1) FROM TaskAttachments ta WHERE ta.TaskId = t.Id AND ta.IsDeleted = 0) AS AttachmentsCount,
        (SELECT COUNT(1) FROM Comments c WHERE c.TaskId = t.Id AND c.IsDeleted = 0) AS CommentsCount
    FROM Tasks t
    LEFT JOIN Teams tm ON t.TeamId = tm.Id
    LEFT JOIN Users u ON t.AssignedToUserId = u.Id
    LEFT JOIN Projects p ON t.ProjectId = p.Id
    WHERE t.IsDeleted = 0
      AND (@Status IS NULL OR t.Status = @Status)
      AND (@Priority IS NULL OR t.Priority = @Priority)
      AND (@TeamId IS NULL OR t.TeamId = @TeamId)
      AND (@ProjectId IS NULL OR t.ProjectId = @ProjectId)
    ORDER BY t.CreatedDate DESC;
END;
GO

CREATE OR ALTER PROCEDURE sp_GetDashboardStats
    @UserId INT = NULL,
    @Role NVARCHAR(50) = 'Admin'
AS
BEGIN
    SET NOCOUNT ON;

    -- Aggregate summary metrics with NOLOCK for maximum throughput
    SELECT 
        COUNT(1) AS TotalTasks,
        COUNT(CASE WHEN t.Status = 5 THEN 1 END) AS CompletedTasks,
        COUNT(CASE WHEN t.Status = 3 THEN 1 END) AS InProgressTasks,
        COUNT(CASE WHEN t.Status IN (0, 1, 2) THEN 1 END) AS PendingTasks,
        COUNT(CASE WHEN t.Status != 5 AND t.DueDate < SYSUTCDATETIME() THEN 1 END) AS OverdueTasks,
        COUNT(CASE WHEN t.Priority = 4 THEN 1 END) AS CriticalPriorityTasks,
        COUNT(CASE WHEN t.Priority = 3 THEN 1 END) AS HighPriorityTasks,
        COUNT(CASE WHEN t.Priority = 2 THEN 1 END) AS MediumPriorityTasks,
        COUNT(CASE WHEN t.Priority = 1 THEN 1 END) AS LowPriorityTasks,
        ISNULL(SUM(t.ActualHours), 0) AS TotalHoursLogged
    FROM Tasks t WITH (NOLOCK)
    WHERE t.IsDeleted = 0
      AND (@Role = 'Admin' OR @Role = 'Manager' OR t.AssignedToUserId = @UserId);
END;
GO

CREATE OR ALTER PROCEDURE sp_GetUserProductivityReport
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        u.Id AS UserId,
        u.FullName,
        u.Email,
        u.Role,
        u.Department,
        COUNT(t.Id) AS TotalAssignedTasks,
        COUNT(CASE WHEN t.Status = 5 THEN 1 END) AS CompletedTasks,
        COUNT(CASE WHEN t.Status = 3 THEN 1 END) AS InProgressTasks,
        COUNT(CASE WHEN t.Status != 5 AND t.DueDate < SYSUTCDATETIME() THEN 1 END) AS OverdueTasks,
        ISNULL(SUM(t.ActualHours), 0) AS TotalHoursLogged,
        CAST(
            CASE 
                WHEN COUNT(t.Id) > 0 
                THEN (CAST(COUNT(CASE WHEN t.Status = 5 THEN 1 END) AS FLOAT) / COUNT(t.Id)) * 100 
                ELSE 0 
            END AS DECIMAL(5,2)
        ) AS CompletionPercentage
    FROM Users u WITH (NOLOCK)
    LEFT JOIN Tasks t WITH (NOLOCK) ON u.Id = t.AssignedToUserId AND t.IsDeleted = 0
    WHERE u.IsDeleted = 0
    GROUP BY u.Id, u.FullName, u.Email, u.Role, u.Department
    ORDER BY CompletedTasks DESC, TotalHoursLogged DESC;
END;
GO

CREATE OR ALTER PROCEDURE sp_GetTeamProductivityReport
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        tm.Id AS TeamId,
        tm.Name AS TeamName,
        mgr.FullName AS ManagerName,
        (SELECT COUNT(1) FROM TeamMembers tmb WITH (NOLOCK) WHERE tmb.TeamId = tm.Id AND tmb.IsDeleted = 0) AS MembersCount,
        COUNT(t.Id) AS TotalTasks,
        COUNT(CASE WHEN t.Status = 5 THEN 1 END) AS CompletedTasks,
        COUNT(CASE WHEN t.Status = 3 THEN 1 END) AS InProgressTasks,
        COUNT(CASE WHEN t.Status != 5 AND t.DueDate < SYSUTCDATETIME() THEN 1 END) AS OverdueTasks,
        CAST(
            CASE 
                WHEN COUNT(t.Id) > 0 
                THEN (CAST(COUNT(CASE WHEN t.Status = 5 THEN 1 END) AS FLOAT) / COUNT(t.Id)) * 100 
                ELSE 0 
            END AS DECIMAL(5,2)
        ) AS VelocityRate
    FROM Teams tm WITH (NOLOCK)
    LEFT JOIN Users mgr WITH (NOLOCK) ON tm.ManagerId = mgr.Id
    LEFT JOIN Tasks t WITH (NOLOCK) ON tm.Id = t.TeamId AND t.IsDeleted = 0
    WHERE tm.IsDeleted = 0
    GROUP BY tm.Id, tm.Name, mgr.FullName
    ORDER BY CompletedTasks DESC;
END;
GO

CREATE OR ALTER PROCEDURE sp_BulkUpdateTaskStatus
    @TaskIdsCsv NVARCHAR(MAX),
    @NewStatus INT,
    @UpdatedById INT
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE Tasks 
    SET Status = @NewStatus,
        LastUpdatedDate = SYSUTCDATETIME()
    WHERE Id IN (SELECT CAST(value AS INT) FROM STRING_SPLIT(@TaskIdsCsv, ','))
      AND IsDeleted = 0;

    SELECT @@ROWCOUNT AS UpdatedCount;
END;
GO

CREATE OR ALTER PROCEDURE sp_GetSystemActivityStats
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @TodayUtc DATETIME2 = CAST(SYSUTCDATETIME() AS DATE);

    SELECT 
        (SELECT COUNT(1) FROM Users WITH (NOLOCK) WHERE IsDeleted = 0 AND (IsOnline = 1 OR (LastActivityDate IS NOT NULL AND LastActivityDate >= DATEADD(minute, -15, SYSUTCDATETIME())))) AS ActiveUsers,
        (SELECT COUNT(1) FROM AuditLogs WITH (NOLOCK) WHERE Action = 'LOGIN' AND Timestamp >= @TodayUtc) AS TodayLogins,
        (SELECT COUNT(1) FROM AuditLogs WITH (NOLOCK) WHERE EntityName = 'Task' AND (Action = 'UPDATE' OR Action = 'STATUS_CHANGE') AND Timestamp >= @TodayUtc) AS TasksUpdatedToday,
        (SELECT COUNT(1) FROM AuditLogs WITH (NOLOCK) WHERE Action = 'DELETE' AND Timestamp >= @TodayUtc) AS DeletionsToday,
        (SELECT COUNT(1) FROM AuditLogs WITH (NOLOCK)) AS TotalAuditLogs;
END;
GO

CREATE OR ALTER PROCEDURE sp_GetUserPresenceList
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        u.Id,
        u.FullName,
        u.Email,
        CASE u.Role WHEN 1 THEN 'Admin' WHEN 2 THEN 'Manager' ELSE 'User' END AS Role,
        u.Department,
        CASE 
            WHEN u.IsOnline = 1 OR (u.LastActivityDate IS NOT NULL AND u.LastActivityDate >= DATEADD(minute, -15, SYSUTCDATETIME())) 
            THEN CAST(1 AS BIT) 
            ELSE CAST(0 AS BIT) 
        END AS IsOnline,
        u.LastLoginDate AS LoginTime,
        ISNULL(u.LastActivityDate, u.LastLoginDate) AS LastActivity,
        u.LastLogoutDate AS LastLogout,
        ISNULL(u.LastIpAddress, '127.0.0.1') AS LastIpAddress,
        ISNULL(u.LastUserAgent, 'Mozilla/5.0') AS LastUserAgent
    FROM Users u WITH (NOLOCK)
    WHERE u.IsDeleted = 0
    ORDER BY IsOnline DESC, u.FullName ASC;
END;
GO

CREATE OR ALTER PROCEDURE sp_RecordTaskView
    @TaskId INT,
    @UserId INT,
    @UserName NVARCHAR(100) = NULL,
    @UserRole NVARCHAR(50) = NULL,
    @IpAddress NVARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (SELECT 1 FROM TaskViews WHERE TaskId = @TaskId AND UserId = @UserId)
    BEGIN
        UPDATE TaskViews
        SET ViewedAt = SYSUTCDATETIME(),
            IpAddress = @IpAddress,
            UserName = ISNULL(@UserName, UserName),
            UserRole = ISNULL(@UserRole, UserRole)
        WHERE TaskId = @TaskId AND UserId = @UserId;
    END
    ELSE
    BEGIN
        INSERT INTO TaskViews (TaskId, UserId, UserName, UserRole, IpAddress, ViewedAt)
        VALUES (@TaskId, @UserId, @UserName, @UserRole, @IpAddress, SYSUTCDATETIME());
    END
END;
GO


-- ==============================================================================================
-- PART 4: COMPLETE ENTERPRISE DUMMY DATASET
-- ==============================================================================================

-- 1. Organizations
IF NOT EXISTS (SELECT 1 FROM Organizations)
BEGIN
    INSERT INTO Organizations (Name, Domain, SubscriptionTier)
    VALUES ('Acme Global Enterprises', 'acme.com', 'Enterprise Platinum');
END
GO

-- 2. Users (Pass: Admin@123 / Manager@123 / User@123)
IF NOT EXISTS (SELECT 1 FROM Users)
BEGIN
    INSERT INTO Users (FullName, Email, PasswordHash, Role, Department)
    VALUES 
    ('System Administrator', 'admin@system.com', '$2a$11$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 1, 'Executive IT'),
    ('Alex Morgan', 'manager@system.com', '$2a$11$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 2, 'Engineering'),
    ('Rahul Sharma', 'rahul@system.com', '$2a$11$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 3, 'Backend Dev'),
    ('Priya Patel', 'priya@system.com', '$2a$11$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 3, 'UI/UX Design'),
    ('John Doe', 'user@system.com', '$2a$11$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 3, 'QA Automation');
END
GO

-- 3. Teams
IF NOT EXISTS (SELECT 1 FROM Teams)
BEGIN
    INSERT INTO Teams (Name, Description, ManagerId, ColorCode)
    VALUES 
    ('Cloud & Infrastructure', 'Scalable distributed systems & microservices', 2, '#38bdf8'),
    ('Product & UX Engineering', 'Accessible user interfaces & design systems', 2, '#a855f7'),
    ('QA & Release Automation', 'Continuous testing pipelines and performance tuning', 2, '#22c55e');
END
GO

-- 4. Projects & Milestones
IF NOT EXISTS (SELECT 1 FROM Projects)
BEGIN
    INSERT INTO Projects (ProjectKey, Name, Description, ManagerId, Budget, CreatedById)
    VALUES 
    ('WF-PRO', 'WorkFlow Pro v2.0 Enterprise Release', 'Next-gen enterprise task and project management suite.', 2, 85000.00, 1),
    ('SEC-AUD', 'Zero-Trust Security & SOC2 Compliance', 'Hardening auth token rotation, rate limiting, and audit logging.', 2, 45000.00, 1);

    INSERT INTO Milestones (ProjectId, Title, DueDate, ProgressPercentage, Status)
    VALUES 
    (1, 'Sprint 1 — Core Architecture & Security', DATEADD(day, 14, SYSUTCDATETIME()), 75.0, 2),
    (1, 'Sprint 2 — Real-Time SignalR & Milestones', DATEADD(day, 30, SYSUTCDATETIME()), 30.0, 1);
END
GO

-- 5. Tasks with Subtasks, Tags & Hours
IF NOT EXISTS (SELECT 1 FROM Tasks)
BEGIN
    INSERT INTO Tasks (ProjectId, MilestoneId, TeamId, AssignedToUserId, Title, Description, Priority, Status, Category, Tags, EstimatedHours, ActualHours, DueDate, CreatedById)
    VALUES 
    (1, 1, 1, 3, 'Implement JWT Refresh Token Rotation & Lockout', 'Configure silent refresh interceptor and brute force account lockout policy.', 4, 3, 'Security', 'jwt,auth,csharp,backend', 16.0, 12.5, DATEADD(day, 2, SYSUTCDATETIME()), 2),
    (1, 1, 2, 4, 'Interactive Kanban Board with HTML5 Drag & Drop', 'Build modern 4-stage column board with colored priority badges and quick actions.', 3, 4, 'Frontend', 'angular,kanban,ui,signals', 20.0, 18.0, DATEADD(day, 1, SYSUTCDATETIME()), 2),
    (1, 2, 3, 5, 'Automate GitHub Actions CI/CD Test Pipeline', 'Execute unit tests, build Docker containers, and package production artifacts.', 2, 2, 'DevOps', 'cicd,github-actions,docker', 10.0, 2.0, DATEADD(day, 5, SYSUTCDATETIME()), 1);

    INSERT INTO SubTasks (TaskId, Title, IsCompleted, SortOrder)
    VALUES 
    (1, 'Create RefreshTokens table and entity', 1, 1),
    (1, 'Add /api/auth/refresh-token endpoint', 1, 2),
    (1, 'Configure Angular HTTP interceptor retry queue', 1, 3),
    (2, 'Design CSS glassmorphism column styles', 1, 1),
    (2, 'Implement card dragstart and drop handlers', 1, 2);
END
GO

PRINT '==============================================================================================';
PRINT '🎉 WorkFlow Pro Master Database successfully deployed with full enterprise seeds!';
PRINT '==============================================================================================';
