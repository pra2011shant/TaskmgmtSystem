-- ==============================================================================================
-- ENTERPRISE TEAM & TASK MANAGEMENT SYSTEM - STORED PROCEDURES (SPs)
-- ==============================================================================================
-- Description:
-- Production-grade Stored Procedures implementing high-throughput business logic,
-- role-based data isolation, audit trail maintenance, and atomic transaction handling.
--
-- Modules Covered:
--   1. Authentication & User Management (sp_RegisterUser, sp_GetUserByEmail, sp_GetUserById, sp_GetAllUsers)
--   2. Task Lifecycle Management (sp_CreateTask, sp_UpdateTask, sp_UpdateTaskStatus, sp_DeleteTask, sp_GetTasksByFilter)
--   3. Team & Member Management (sp_CreateTeam, sp_GetTeams, sp_AddTeamMember, sp_RemoveTeamMember)
--   4. Collaboration & Alerts (sp_AddTaskComment, sp_GetTaskComments, sp_CreateNotification, sp_GetUserNotifications, sp_MarkNotificationAsRead)
--   5. Real-Time Metrics & Analytics (sp_GetDashboardSummary)
-- ==============================================================================================

USE ManagementSystem;
GO

-- ==============================================================================================
-- 1. AUTHENTICATION & USER MANAGEMENT PROCEDURES
-- ==============================================================================================

-- ----------------------------------------------------------------------------------------------
-- SP: sp_RegisterUser
-- Purpose: Registers a new user account with unique email enforcement and audit tracking.
-- ----------------------------------------------------------------------------------------------
CREATE OR ALTER PROCEDURE sp_RegisterUser
    @FullName NVARCHAR(100),
    @Email NVARCHAR(150),
    @PasswordHash NVARCHAR(MAX),
    @Role INT,
    @Remarks NVARCHAR(500) = NULL,
    @CreatedById INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        -- Check for existing active user with identical email
        IF EXISTS (SELECT 1 FROM Users WHERE LOWER(Email) = LOWER(LTRIM(RTRIM(@Email))) AND IsDeleted = 0)
        BEGIN
            RAISERROR('An account with this email address already exists.', 16, 1);
            RETURN;
        END

        INSERT INTO Users (
            FullName,
            Email,
            PasswordHash,
            Role,
            Remarks,
            Status,
            IsDeleted,
            CreatedDate,
            CreatedById
        )
        VALUES (
            LTRIM(RTRIM(@FullName)),
            LOWER(LTRIM(RTRIM(@Email))),
            @PasswordHash,
            @Role,
            @Remarks,
            1, -- Active
            0, -- Not Deleted
            SYSUTCDATETIME(),
            @CreatedById
        );

        SELECT SCOPE_IDENTITY() AS NewUserId;
    END TRY
    BEGIN CATCH
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
        DECLARE @ErrorState INT = ERROR_STATE();
        RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
    END CATCH
END
GO

-- ----------------------------------------------------------------------------------------------
-- SP: sp_GetUserByEmail
-- Purpose: Retrieves an active user profile and cryptographic hash for authentication.
-- ----------------------------------------------------------------------------------------------
CREATE OR ALTER PROCEDURE sp_GetUserByEmail
    @Email NVARCHAR(150)
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        Id,
        FullName,
        Email,
        PasswordHash,
        Role,
        Remarks,
        Status,
        IsDeleted,
        CreatedDate,
        LastUpdatedDate,
        CreatedById
    FROM Users
    WHERE LOWER(Email) = LOWER(LTRIM(RTRIM(@Email)))
      AND IsDeleted = 0;
END
GO

-- ----------------------------------------------------------------------------------------------
-- SP: sp_GetUserById
-- Purpose: Retrieves detailed user profile by unique identifier.
-- ----------------------------------------------------------------------------------------------
CREATE OR ALTER PROCEDURE sp_GetUserById
    @UserId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        Id,
        FullName,
        Email,
        Role,
        Remarks,
        Status,
        IsDeleted,
        CreatedDate,
        LastUpdatedDate,
        CreatedById
    FROM Users
    WHERE Id = @UserId 
      AND IsDeleted = 0;
END
GO

-- ----------------------------------------------------------------------------------------------
-- SP: sp_GetAllUsers
-- Purpose: Returns all active users for administrative directories and assignment pickers.
-- ----------------------------------------------------------------------------------------------
CREATE OR ALTER PROCEDURE sp_GetAllUsers
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        Id,
        FullName,
        Email,
        Role,
        Remarks,
        Status,
        IsDeleted,
        CreatedDate,
        LastUpdatedDate,
        CreatedById
    FROM Users
    WHERE IsDeleted = 0
    ORDER BY FullName ASC;
END
GO


-- ==============================================================================================
-- 2. TASK LIFECYCLE MANAGEMENT PROCEDURES
-- ==============================================================================================

-- ----------------------------------------------------------------------------------------------
-- SP: sp_CreateTask
-- Purpose: Inserts a new work task and returns the newly generated Task ID.
-- ----------------------------------------------------------------------------------------------
CREATE OR ALTER PROCEDURE sp_CreateTask
    @Title NVARCHAR(200),
    @Description NVARCHAR(2000),
    @Status INT,
    @Priority INT,
    @DueDate DATETIME2,
    @TeamId INT,
    @AssignedToUserId INT,
    @CreatedById INT,
    @Remarks NVARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        INSERT INTO Tasks (
            Title,
            Description,
            Status,
            Priority,
            DueDate,
            TeamId,
            AssignedToUserId,
            CreatedById,
            Remarks,
            IsDeleted,
            CreatedDate
        )
        VALUES (
            LTRIM(RTRIM(@Title)),
            @Description,
            @Status,
            @Priority,
            @DueDate,
            @TeamId,
            @AssignedToUserId,
            @CreatedById,
            @Remarks,
            0,
            SYSUTCDATETIME()
        );

        SELECT SCOPE_IDENTITY() AS NewTaskId;
    END TRY
    BEGIN CATCH
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
        DECLARE @ErrorState INT = ERROR_STATE();
        RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
    END CATCH
END
GO

-- ----------------------------------------------------------------------------------------------
-- SP: sp_UpdateTask
-- Purpose: Updates an existing task entity with full attribute modification and timestamping.
-- ----------------------------------------------------------------------------------------------
CREATE OR ALTER PROCEDURE sp_UpdateTask
    @TaskId INT,
    @Title NVARCHAR(200),
    @Description NVARCHAR(2000),
    @Status INT,
    @Priority INT,
    @DueDate DATETIME2,
    @TeamId INT,
    @AssignedToUserId INT,
    @Remarks NVARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE Tasks
    SET Title = LTRIM(RTRIM(@Title)),
        Description = @Description,
        Status = @Status,
        Priority = @Priority,
        DueDate = @DueDate,
        TeamId = @TeamId,
        AssignedToUserId = @AssignedToUserId,
        Remarks = COALESCE(@Remarks, Remarks),
        LastUpdatedDate = SYSUTCDATETIME()
    WHERE Id = @TaskId 
      AND IsDeleted = 0;

    SELECT @@ROWCOUNT AS RowsAffected;
END
GO

-- ----------------------------------------------------------------------------------------------
-- SP: sp_UpdateTaskStatus
-- Purpose: Lightweight state machine transition (ToDo -> InProgress -> Done).
-- ----------------------------------------------------------------------------------------------
CREATE OR ALTER PROCEDURE sp_UpdateTaskStatus
    @TaskId INT,
    @NewStatus INT
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE Tasks
    SET Status = @NewStatus,
        LastUpdatedDate = SYSUTCDATETIME()
    WHERE Id = @TaskId 
      AND IsDeleted = 0;

    SELECT @@ROWCOUNT AS RowsAffected;
END
GO

-- ----------------------------------------------------------------------------------------------
-- SP: sp_DeleteTask
-- Purpose: Executes a logical soft-delete on a target task, preserving historical references.
-- ----------------------------------------------------------------------------------------------
CREATE OR ALTER PROCEDURE sp_DeleteTask
    @TaskId INT
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE Tasks 
    SET IsDeleted = 1,
        LastUpdatedDate = SYSUTCDATETIME()
    WHERE Id = @TaskId;

    SELECT @@ROWCOUNT AS RowsAffected;
END
GO

-- ----------------------------------------------------------------------------------------------
-- SP: sp_GetTasksByFilter
-- Purpose: High-performance multi-criteria search and retrieval with Role-Based Access Control (RBAC).
-- ----------------------------------------------------------------------------------------------
CREATE OR ALTER PROCEDURE sp_GetTasksByFilter
    @Search NVARCHAR(100) = NULL,
    @Status INT = NULL,
    @Priority INT = NULL,
    @TeamId INT = NULL,
    @AssignedToUserId INT = NULL,
    @CurrentUserId INT,
    @UserRole NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        t.Id,
        t.Title,
        t.Description,
        t.Status,
        t.Priority,
        t.DueDate,
        t.TeamId,
        tm.Name AS TeamName,
        t.AssignedToUserId,
        u_assignee.FullName AS AssignedToUserName,
        u_assignee.Email AS AssignedToUserEmail,
        t.CreatedById AS CreatedByUserId,
        u_creator.FullName AS CreatedByUserName,
        t.Remarks,
        t.IsDeleted,
        t.CreatedDate AS CreatedAt,
        t.LastUpdatedDate AS UpdatedAt,
        -- Correlated count of active task comments
        (SELECT COUNT(1) FROM Comments c WHERE c.TaskId = t.Id AND c.IsDeleted = 0) AS CommentsCount
    FROM Tasks t
    LEFT JOIN Teams tm ON t.TeamId = tm.Id AND tm.IsDeleted = 0
    LEFT JOIN Users u_assignee ON t.AssignedToUserId = u_assignee.Id AND u_assignee.IsDeleted = 0
    INNER JOIN Users u_creator ON t.CreatedById = u_creator.Id
    WHERE 
        t.IsDeleted = 0
        -- Full-text keyword matching across title and description
        AND (@Search IS NULL OR t.Title LIKE '%' + @Search + '%' OR t.Description LIKE '%' + @Search + '%')
        -- Status, Priority, Team, and Assignee Filters
        AND (@Status IS NULL OR t.Status = @Status)
        AND (@Priority IS NULL OR t.Priority = @Priority)
        AND (@TeamId IS NULL OR t.TeamId = @TeamId)
        AND (@AssignedToUserId IS NULL OR t.AssignedToUserId = @AssignedToUserId)
        -- Role-Based Access Control (RBAC) Data Security Partitioning
        AND (
            @UserRole = 'Admin'
            OR (@UserRole = 'Manager' AND (tm.ManagerId = @CurrentUserId OR t.CreatedById = @CurrentUserId OR t.AssignedToUserId = @CurrentUserId))
            OR (@UserRole = 'User' AND (t.AssignedToUserId = @CurrentUserId OR t.CreatedById = @CurrentUserId))
        )
    ORDER BY t.CreatedDate DESC;
END
GO

-- ----------------------------------------------------------------------------------------------
-- SP: sp_GetTaskById
-- Purpose: Retrieves complete task specifications, assignee metadata, and audit fields by Task ID.
-- ----------------------------------------------------------------------------------------------
CREATE OR ALTER PROCEDURE sp_GetTaskById
    @TaskId INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        t.Id,
        t.Title,
        t.Description,
        t.Status,
        t.Priority,
        t.DueDate,
        t.TeamId,
        tm.Name AS TeamName,
        t.AssignedToUserId,
        u_assignee.FullName AS AssignedToUserName,
        u_assignee.Email AS AssignedToUserEmail,
        t.CreatedById AS CreatedByUserId,
        u_creator.FullName AS CreatedByUserName,
        t.Remarks,
        t.Status AS RecordStatus,
        t.IsDeleted,
        t.CreatedDate AS CreatedAt,
        t.LastUpdatedDate AS UpdatedAt,
        (SELECT COUNT(1) FROM Comments c WHERE c.TaskId = t.Id AND c.IsDeleted = 0) AS CommentsCount
    FROM Tasks t
    LEFT JOIN Teams tm ON t.TeamId = tm.Id AND tm.IsDeleted = 0
    LEFT JOIN Users u_assignee ON t.AssignedToUserId = u_assignee.Id AND u_assignee.IsDeleted = 0
    INNER JOIN Users u_creator ON t.CreatedById = u_creator.Id
    WHERE t.Id = @TaskId 
      AND t.IsDeleted = 0;
END
GO


-- ==============================================================================================
-- 3. TEAM & MEMBER MANAGEMENT PROCEDURES
-- ==============================================================================================

-- ----------------------------------------------------------------------------------------------
-- SP: sp_CreateTeam
-- Purpose: Atomically provisions a new team and registers the assigned manager into team roster.
-- ----------------------------------------------------------------------------------------------
CREATE OR ALTER PROCEDURE sp_CreateTeam
    @Name NVARCHAR(150),
    @Description NVARCHAR(500),
    @ManagerId INT,
    @Remarks NVARCHAR(500) = NULL,
    @CreatedById INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        INSERT INTO Teams (Name, Description, ManagerId, Remarks, Status, IsDeleted, CreatedDate, CreatedById)
        VALUES (LTRIM(RTRIM(@Name)), @Description, @ManagerId, @Remarks, 1, 0, SYSUTCDATETIME(), @CreatedById);

        DECLARE @NewTeamId INT = SCOPE_IDENTITY();

        -- Automatically link manager into TeamMembers membership
        IF @ManagerId IS NOT NULL
        BEGIN
            INSERT INTO TeamMembers (TeamId, UserId, Status, IsDeleted, CreatedDate, CreatedById)
            VALUES (@NewTeamId, @ManagerId, 1, 0, SYSUTCDATETIME(), @CreatedById);
        END

        COMMIT TRANSACTION;

        SELECT @NewTeamId AS NewTeamId;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
        DECLARE @ErrorState INT = ERROR_STATE();
        RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
    END CATCH
END
GO

-- ----------------------------------------------------------------------------------------------
-- SP: sp_GetTeams
-- Purpose: Returns all active teams with manager metadata and total active member counts.
-- ----------------------------------------------------------------------------------------------
CREATE OR ALTER PROCEDURE sp_GetTeams
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        t.Id,
        t.Name,
        t.Description,
        t.ManagerId,
        u.FullName AS ManagerName,
        u.Email AS ManagerEmail,
        t.Remarks,
        t.Status,
        t.CreatedDate,
        t.LastUpdatedDate,
        (SELECT COUNT(1) FROM TeamMembers tm WHERE tm.TeamId = t.Id AND tm.IsDeleted = 0) AS MemberCount
    FROM Teams t
    LEFT JOIN Users u ON t.ManagerId = u.Id AND u.IsDeleted = 0
    WHERE t.IsDeleted = 0
    ORDER BY t.Name ASC;
END
GO

-- ----------------------------------------------------------------------------------------------
-- SP: sp_AddTeamMember
-- Purpose: Associates an active user with a team; reactivates soft-deleted membership if prior record exists.
-- ----------------------------------------------------------------------------------------------
CREATE OR ALTER PROCEDURE sp_AddTeamMember
    @TeamId INT,
    @UserId INT,
    @CreatedById INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    -- If soft-deleted record exists, reactivate it; otherwise create a new membership
    IF EXISTS (SELECT 1 FROM TeamMembers WHERE TeamId = @TeamId AND UserId = @UserId)
    BEGIN
        UPDATE TeamMembers
        SET IsDeleted = 0,
            Status = 1,
            LastUpdatedDate = SYSUTCDATETIME()
        WHERE TeamId = @TeamId AND UserId = @UserId;
    END
    ELSE
    BEGIN
        INSERT INTO TeamMembers (TeamId, UserId, Status, IsDeleted, CreatedDate, CreatedById)
        VALUES (@TeamId, @UserId, 1, 0, SYSUTCDATETIME(), @CreatedById);
    END

    SELECT @@ROWCOUNT AS RowsAffected;
END
GO

-- ----------------------------------------------------------------------------------------------
-- SP: sp_RemoveTeamMember
-- Purpose: Soft deletes an active member from the designated team.
-- ----------------------------------------------------------------------------------------------
CREATE OR ALTER PROCEDURE sp_RemoveTeamMember
    @TeamId INT,
    @UserId INT
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE TeamMembers
    SET IsDeleted = 1,
        LastUpdatedDate = SYSUTCDATETIME()
    WHERE TeamId = @TeamId 
      AND UserId = @UserId;

    SELECT @@ROWCOUNT AS RowsAffected;
END
GO

-- ----------------------------------------------------------------------------------------------
-- SP: sp_UpdateTeam
-- Purpose: Updates an existing team's name, description, and assigned manager.
-- ----------------------------------------------------------------------------------------------
CREATE OR ALTER PROCEDURE sp_UpdateTeam
    @TeamId INT,
    @Name NVARCHAR(150),
    @Description NVARCHAR(500) = NULL,
    @ManagerId INT = NULL,
    @Remarks NVARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE Teams
    SET Name = LTRIM(RTRIM(@Name)),
        Description = @Description,
        ManagerId = @ManagerId,
        Remarks = COALESCE(@Remarks, Remarks),
        LastUpdatedDate = SYSUTCDATETIME()
    WHERE Id = @TeamId 
      AND IsDeleted = 0;

    -- Ensure manager is present in team membership
    IF @ManagerId IS NOT NULL
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM TeamMembers WHERE TeamId = @TeamId AND UserId = @ManagerId)
        BEGIN
            INSERT INTO TeamMembers (TeamId, UserId, Status, IsDeleted, CreatedDate)
            VALUES (@TeamId, @ManagerId, 1, 0, SYSUTCDATETIME());
        END
        ELSE
        BEGIN
            UPDATE TeamMembers
            SET IsDeleted = 0,
                Status = 1,
                LastUpdatedDate = SYSUTCDATETIME()
            WHERE TeamId = @TeamId AND UserId = @ManagerId;
        END
    END

    SELECT @@ROWCOUNT AS RowsAffected;
END
GO

-- ----------------------------------------------------------------------------------------------
-- SP: sp_DeleteTeam
-- Purpose: Logically soft-deletes a team and disassociates its active member memberships.
-- ----------------------------------------------------------------------------------------------
CREATE OR ALTER PROCEDURE sp_DeleteTeam
    @TeamId INT
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        UPDATE Teams
        SET IsDeleted = 1,
            LastUpdatedDate = SYSUTCDATETIME()
        WHERE Id = @TeamId;

        UPDATE TeamMembers
        SET IsDeleted = 1,
            LastUpdatedDate = SYSUTCDATETIME()
        WHERE TeamId = @TeamId;

        COMMIT TRANSACTION;

        SELECT 1 AS Success;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
        DECLARE @ErrorState INT = ERROR_STATE();
        RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
    END CATCH
END
GO


-- ==============================================================================================
-- 4. COLLABORATION & NOTIFICATIONS PROCEDURES
-- ==============================================================================================

-- ----------------------------------------------------------------------------------------------
-- SP: sp_AddTaskComment
-- Purpose: Appends a collaborative comment to a task discussion thread.
-- ----------------------------------------------------------------------------------------------
CREATE OR ALTER PROCEDURE sp_AddTaskComment
    @TaskId INT,
    @UserId INT,
    @Content NVARCHAR(1000),
    @Remarks NVARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO Comments (TaskId, UserId, Content, Remarks, Status, IsDeleted, CreatedDate, CreatedById)
    VALUES (@TaskId, @UserId, LTRIM(RTRIM(@Content)), @Remarks, 1, 0, SYSUTCDATETIME(), @UserId);

    SELECT SCOPE_IDENTITY() AS NewCommentId;
END
GO

-- ----------------------------------------------------------------------------------------------
-- SP: sp_GetTaskComments
-- Purpose: Retrieves chronologically ordered comments for a specific task.
-- ----------------------------------------------------------------------------------------------
CREATE OR ALTER PROCEDURE sp_GetTaskComments
    @TaskId INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        c.Id,
        c.TaskId,
        c.UserId,
        u.FullName AS UserName,
        CASE u.Role 
            WHEN 1 THEN 'Admin' 
            WHEN 2 THEN 'Manager' 
            ELSE 'User' 
        END AS UserRole,
        c.Content,
        c.Remarks,
        c.CreatedDate AS CreatedAt
    FROM Comments c
    INNER JOIN Users u ON c.UserId = u.Id AND u.IsDeleted = 0
    WHERE c.TaskId = @TaskId 
      AND c.IsDeleted = 0
    ORDER BY c.CreatedDate ASC;
END
GO

-- ----------------------------------------------------------------------------------------------
-- SP: sp_CreateNotification
-- Purpose: Dispatches an asynchronous in-app notification to a recipient user.
-- ----------------------------------------------------------------------------------------------
CREATE OR ALTER PROCEDURE sp_CreateNotification
    @UserId INT,
    @Title NVARCHAR(200),
    @Message NVARCHAR(1000),
    @Type NVARCHAR(50),
    @RelatedTaskId INT = NULL,
    @CreatedById INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO Notifications (
        UserId,
        Title,
        Message,
        Type,
        RelatedTaskId,
        IsRead,
        Status,
        IsDeleted,
        CreatedDate,
        CreatedById
    )
    VALUES (
        @UserId,
        LTRIM(RTRIM(@Title)),
        LTRIM(RTRIM(@Message)),
        @Type,
        @RelatedTaskId,
        0, -- Unread
        1, -- Active
        0, -- Not Deleted
        SYSUTCDATETIME(),
        @CreatedById
    );

    SELECT SCOPE_IDENTITY() AS NewNotificationId;
END
GO

-- ----------------------------------------------------------------------------------------------
-- SP: sp_GetUserNotifications
-- Purpose: Fetches the latest notifications for the active user.
-- ----------------------------------------------------------------------------------------------
CREATE OR ALTER PROCEDURE sp_GetUserNotifications
    @UserId INT,
    @TopCount INT = 20
AS
BEGIN
    SET NOCOUNT ON;

    SELECT TOP (@TopCount)
        Id,
        UserId,
        Title,
        Message,
        Type,
        RelatedTaskId,
        IsRead,
        CreatedDate AS CreatedAt
    FROM Notifications
    WHERE UserId = @UserId 
      AND IsDeleted = 0
    ORDER BY CreatedDate DESC;
END
GO

-- ----------------------------------------------------------------------------------------------
-- SP: sp_MarkNotificationAsRead
-- Purpose: Updates the read state of a notification or all notifications for a user.
-- ----------------------------------------------------------------------------------------------
CREATE OR ALTER PROCEDURE sp_MarkNotificationAsRead
    @NotificationId INT = NULL,
    @UserId INT
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE Notifications
    SET IsRead = 1,
        LastUpdatedDate = SYSUTCDATETIME()
    WHERE UserId = @UserId
      AND (@NotificationId IS NULL OR Id = @NotificationId)
      AND IsRead = 0;

    SELECT @@ROWCOUNT AS RowsAffected;
END
GO

-- ----------------------------------------------------------------------------------------------
-- SP: sp_MarkAllNotificationsAsRead
-- Purpose: Bulk-marks all unread notifications as read for a designated user.
-- ----------------------------------------------------------------------------------------------
CREATE OR ALTER PROCEDURE sp_MarkAllNotificationsAsRead
    @UserId INT
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE Notifications
    SET IsRead = 1,
        LastUpdatedDate = SYSUTCDATETIME()
    WHERE UserId = @UserId 
      AND IsRead = 0 
      AND IsDeleted = 0;

    SELECT @@ROWCOUNT AS RowsAffected;
END
GO


-- ==============================================================================================
-- 5. REAL-TIME METRICS & ANALYTICS PROCEDURES
-- ==============================================================================================

-- ----------------------------------------------------------------------------------------------
-- SP: sp_GetDashboardSummary
-- Purpose: Calculates operational KPI metrics (Total, ToDo, InProgress, Done, Overdue)
--          with defensive COALESCE aggregation to prevent NULL results.
-- ----------------------------------------------------------------------------------------------
CREATE OR ALTER PROCEDURE sp_GetDashboardSummary
    @CurrentUserId INT,
    @UserRole NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        COUNT(1) AS TotalTasks,
        COALESCE(SUM(CASE WHEN t.Status = 1 THEN 1 ELSE 0 END), 0) AS ToDoTasks,
        COALESCE(SUM(CASE WHEN t.Status = 2 THEN 1 ELSE 0 END), 0) AS InProgressTasks,
        COALESCE(SUM(CASE WHEN t.Status = 3 THEN 1 ELSE 0 END), 0) AS DoneTasks,
        COALESCE(SUM(CASE WHEN t.DueDate IS NOT NULL AND t.DueDate < SYSUTCDATETIME() AND t.Status <> 3 THEN 1 ELSE 0 END), 0) AS OverdueTasks
    FROM Tasks t
    LEFT JOIN Teams tm ON t.TeamId = tm.Id AND tm.IsDeleted = 0
    WHERE 
        t.IsDeleted = 0
        AND (
            (@UserRole = 'Admin')
            OR (@UserRole = 'Manager' AND (tm.ManagerId = @CurrentUserId OR t.CreatedById = @CurrentUserId OR t.AssignedToUserId = @CurrentUserId))
            OR (@UserRole = 'User' AND (t.AssignedToUserId = @CurrentUserId OR t.CreatedById = @CurrentUserId))
        );
END
GO

PRINT '==============================================================================================';
PRINT 'Enterprise Stored Procedures compiled successfully with production optimizations.';
PRINT '==============================================================================================';
