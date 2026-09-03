-- ==============================================================================================
-- ENTERPRISE TEAM & TASK MANAGEMENT SYSTEM - DATABASE SCHEMA SCRIPT
-- ==============================================================================================
-- Description:
-- Production-grade SQL Server schema initialization script for 'ManagementSystem'.
-- Provisions core enterprise tables: Users, Teams, TeamMembers, Tasks, Comments, and Notifications.
-- 
-- Standard Audit & Tracking Columns implemented across all entities:
--   1. Remarks         -> Optional administrative notes / context
--   2. Status          -> Record lifecycle state (1 = Active, 0 = Inactive / Suspended)
--   3. IsDeleted       -> Logical soft-delete indicator (0 = Active, 1 = Soft Deleted)
--   4. CreatedDate     -> UTC timestamp of record creation (SYSUTCDATETIME)
--   5. LastUpdatedDate -> UTC timestamp of latest record modification
--   6. CreatedById     -> Foreign Key / Identity reference of creator user
-- ==============================================================================================

-- ----------------------------------------------------------------------------------------------
-- Database Creation
-- ----------------------------------------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM sys.databases WHERE name = 'ManagementSystem')
BEGIN
    CREATE DATABASE ManagementSystem;
    PRINT 'Database ManagementSystem successfully created.';
END
GO

USE ManagementSystem;
GO

-- ==============================================================================================
-- 1. USERS TABLE (Enterprise Accounts, Authentication & Role Assignments)
-- ==============================================================================================
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'Users')
BEGIN
    CREATE TABLE Users (
        Id INT IDENTITY(1,1) PRIMARY KEY,                       -- Auto-incrementing unique user identifier
        FullName NVARCHAR(100) NOT NULL,                        -- User legal / display name
        Email NVARCHAR(150) NOT NULL UNIQUE,                    -- Unique enterprise email identifier
        PasswordHash NVARCHAR(MAX) NOT NULL,                    -- Secure BCrypt salted password hash
        Role INT NOT NULL DEFAULT 3,                            -- RBAC Role: 1 = Admin, 2 = Manager, 3 = User
        
        -- Enterprise Audit & Tracking Columns
        Remarks NVARCHAR(500) NULL,                             -- Administrative remarks
        Status INT NOT NULL DEFAULT 1,                          -- 1 = Active, 0 = Suspended
        IsDeleted BIT NOT NULL DEFAULT 0,                       -- 0 = Active, 1 = Soft Deleted
        CreatedDate DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),-- UTC creation timestamp
        LastUpdatedDate DATETIME2 NULL,                         -- UTC last modified timestamp
        CreatedById INT NULL                                    -- Creator identifier (Self / Provisioning Admin)
    );
    PRINT 'Table [Users] successfully initialized.';
END
GO

-- ==============================================================================================
-- 2. TEAMS TABLE (Organizational Units & Functional Departments)
-- ==============================================================================================
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'Teams')
BEGIN
    CREATE TABLE Teams (
        Id INT IDENTITY(1,1) PRIMARY KEY,                       -- Auto-incrementing unique team identifier
        Name NVARCHAR(150) NOT NULL,                            -- Unique department or team designation
        Description NVARCHAR(500) NULL,                         -- Department mission and operational scope
        ManagerId INT NULL FOREIGN KEY REFERENCES Users(Id) ON DELETE SET NULL, -- Assigned Team Lead / Manager
        
        -- Enterprise Audit & Tracking Columns
        Remarks NVARCHAR(500) NULL,
        Status INT NOT NULL DEFAULT 1,
        IsDeleted BIT NOT NULL DEFAULT 0,
        CreatedDate DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        LastUpdatedDate DATETIME2 NULL,
        CreatedById INT NULL
    );
    PRINT 'Table [Teams] successfully initialized.';
END
GO

-- ==============================================================================================
-- 3. TEAM MEMBERS TABLE (Many-to-Many Association: Teams <-> Users)
-- ==============================================================================================
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'TeamMembers')
BEGIN
    CREATE TABLE TeamMembers (
        Id INT IDENTITY(1,1) PRIMARY KEY,                       -- Unique membership record identifier
        TeamId INT NOT NULL FOREIGN KEY REFERENCES Teams(Id) ON DELETE CASCADE, -- Target team reference
        UserId INT NOT NULL FOREIGN KEY REFERENCES Users(Id) ON DELETE CASCADE, -- Assigned member reference
        
        -- Enterprise Audit & Tracking Columns
        Remarks NVARCHAR(500) NULL,
        Status INT NOT NULL DEFAULT 1,
        IsDeleted BIT NOT NULL DEFAULT 0,
        CreatedDate DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        LastUpdatedDate DATETIME2 NULL,
        CreatedById INT NULL,
        
        -- Prevent duplicate assignment of user to the same team
        CONSTRAINT UQ_Team_User UNIQUE (TeamId, UserId)
    );
    PRINT 'Table [TeamMembers] successfully initialized.';
END
GO

-- ==============================================================================================
-- 4. TASKS TABLE (Work Items, Deliverables & Workflow Progress)
-- ==============================================================================================
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'Tasks')
BEGIN
    CREATE TABLE Tasks (
        Id INT IDENTITY(1,1) PRIMARY KEY,                       -- Auto-incrementing unique task identifier
        Title NVARCHAR(200) NOT NULL,                           -- Concise summary / work package title
        Description NVARCHAR(2000) NULL,                        -- Detailed specifications & acceptance criteria
        Priority INT NOT NULL DEFAULT 2,                        -- 1 = Low, 2 = Medium, 3 = High, 4 = Urgent
        DueDate DATETIME2 NULL,                                 -- Target completion deadline (UTC)
        TeamId INT NULL FOREIGN KEY REFERENCES Teams(Id) ON DELETE SET NULL, -- Owning team reference
        AssignedToUserId INT NULL FOREIGN KEY REFERENCES Users(Id) ON DELETE SET NULL, -- Assigned assignee
        
        -- Enterprise Audit & Tracking Columns
        Remarks NVARCHAR(500) NULL,
        Status INT NOT NULL DEFAULT 1,                          -- Workflow State: 1 = ToDo, 2 = InProgress, 3 = Done
        IsDeleted BIT NOT NULL DEFAULT 0,                       -- Soft-delete flag
        CreatedDate DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        LastUpdatedDate DATETIME2 NULL,
        CreatedById INT NOT NULL FOREIGN KEY REFERENCES Users(Id) -- Task author
    );
    PRINT 'Table [Tasks] successfully initialized.';
END
GO

-- ==============================================================================================
-- 5. COMMENTS TABLE (Audit Trail Discussions & Collaboration)
-- ==============================================================================================
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'Comments')
BEGIN
    CREATE TABLE Comments (
        Id INT IDENTITY(1,1) PRIMARY KEY,                       -- Unique comment identifier
        TaskId INT NOT NULL FOREIGN KEY REFERENCES Tasks(Id) ON DELETE CASCADE, -- Context task reference
        UserId INT NOT NULL FOREIGN KEY REFERENCES Users(Id),                   -- Comment author reference
        Content NVARCHAR(1000) NOT NULL,                        -- Discussion message payload
        
        -- Enterprise Audit & Tracking Columns
        Remarks NVARCHAR(500) NULL,
        Status INT NOT NULL DEFAULT 1,
        IsDeleted BIT NOT NULL DEFAULT 0,
        CreatedDate DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        LastUpdatedDate DATETIME2 NULL,
        CreatedById INT NULL
    );
    PRINT 'Table [Comments] successfully initialized.';
END
GO

-- ==============================================================================================
-- 6. NOTIFICATIONS TABLE (Asynchronous User Alerts & Event Dispatch)
-- ==============================================================================================
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'Notifications')
BEGIN
    CREATE TABLE Notifications (
        Id INT IDENTITY(1,1) PRIMARY KEY,                       -- Unique notification identifier
        UserId INT NOT NULL FOREIGN KEY REFERENCES Users(Id) ON DELETE CASCADE, -- Recipient user identifier
        Title NVARCHAR(200) NOT NULL,                           -- Notification summary header
        Message NVARCHAR(1000) NOT NULL,                        -- Event notification narrative body
        Type NVARCHAR(50) NOT NULL DEFAULT 'TaskAssigned',      -- Event category: TaskAssigned, StatusUpdated, CommentAdded
        RelatedTaskId INT NULL,                                 -- Optional deep-link task reference
        IsRead BIT NOT NULL DEFAULT 0,                          -- 0 = Unread, 1 = Read
        
        -- Enterprise Audit & Tracking Columns
        Remarks NVARCHAR(500) NULL,
        Status INT NOT NULL DEFAULT 1,
        IsDeleted BIT NOT NULL DEFAULT 0,
        CreatedDate DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        LastUpdatedDate DATETIME2 NULL,
        CreatedById INT NULL
    );
    PRINT 'Table [Notifications] successfully initialized.';
END
GO

-- ==============================================================================================
-- 7. PERFORMANCE OPTIMIZATION INDEXES (Non-Clustered Indexes)
-- ==============================================================================================
-- Tasks Filtering & Reporting Index
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Tasks_Status_DueDate' AND object_id = OBJECT_ID('Tasks'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_Tasks_Status_DueDate 
    ON Tasks (Status, DueDate, IsDeleted) 
    INCLUDE (Title, Priority, AssignedToUserId, TeamId);
    PRINT 'Index [IX_Tasks_Status_DueDate] created.';
END
GO

-- Tasks Assignee Lookup Index
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Tasks_AssignedToUserId' AND object_id = OBJECT_ID('Tasks'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_Tasks_AssignedToUserId 
    ON Tasks (AssignedToUserId, IsDeleted);
    PRINT 'Index [IX_Tasks_AssignedToUserId] created.';
END
GO

-- Tasks Team Association Index
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Tasks_TeamId' AND object_id = OBJECT_ID('Tasks'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_Tasks_TeamId 
    ON Tasks (TeamId, IsDeleted);
    PRINT 'Index [IX_Tasks_TeamId] created.';
END
GO

-- Team Members User Search Index
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_TeamMembers_UserId' AND object_id = OBJECT_ID('TeamMembers'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_TeamMembers_UserId 
    ON TeamMembers (UserId, TeamId, IsDeleted);
    PRINT 'Index [IX_TeamMembers_UserId] created.';
END
GO

-- Comments by Task Lookup Index
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Comments_TaskId' AND object_id = OBJECT_ID('Comments'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_Comments_TaskId 
    ON Comments (TaskId, IsDeleted) 
    INCLUDE (UserId, CreatedDate);
    PRINT 'Index [IX_Comments_TaskId] created.';
END
GO

-- Notifications Recipient & Unread State Index
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Notifications_UserId_IsRead' AND object_id = OBJECT_ID('Notifications'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_Notifications_UserId_IsRead 
    ON Notifications (UserId, IsRead, IsDeleted) 
    INCLUDE (Title, Message, Type, RelatedTaskId, CreatedDate);
    PRINT 'Index [IX_Notifications_UserId_IsRead] created.';
END
GO

PRINT '==============================================================================================';
PRINT 'Database schema and performance indexes successfully configured with enterprise standards.';
PRINT '==============================================================================================';
