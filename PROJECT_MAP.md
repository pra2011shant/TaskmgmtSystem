# WorkFlow Pro — Complete Architecture Map & Step-by-Step Project Guide

> **Enterprise Role-Based Full-Stack Task & Team Management System**  
> Built with **ASP.NET Core 8 Web API**, **Entity Framework Core**, **Microsoft SQL Server 2025**, and **Angular 19 (Standalone & Signals)**.

---

## 🗺️ Part 1: Application Navigation & Pages Map (Frontend Sitemap)

Below is the complete visual map of every screen, its URL, access permissions, and primary user interactions:

```
[ Public Zone ]
       │
       └──> /login (Sign In Screen)
              ├── 1-Click Demo Quick Logins (Admin, Manager, User)
              ├── Password Eye Toggle (Show/Hide)
              └── Corporate Security Notice (Accounts provisioned by Admin)

[ Protected Zone (Requires JWT Authentication) ]
       │
       ├──> /dashboard (Executive KPI & Operational Overview)
       │      ├── Real-Time Summary Counters (Total, Completed, Pending, Overdue)
       │      ├── Task Status Distribution Breakdown
       │      ├── Priority Distribution Chart
       │      └── Recent Team Activity Feed
       │
       ├──> /tasks (Interactive Tasks & Kanban Workflow)
       │      ├── Dual View Modes: Visual Kanban Columns (To Do, In Progress, Done) vs Data Table
       │      ├── Fast Status Shift Arrows (Move directly across Kanban stages)
       │      ├── Advanced Filtering: Search by keyword, Workflow Status, Urgency Priority, Team, Overdue
       │      ├── Admin Audit Columns: "Created Date" and "Remarks" rendered strictly for Admin
       │      └── Task Creation & Edit Modal (Includes Admin Remarks note)
       │
       ├──> /schedule (Date-Wise Assignment Timeline & Calendar)
       │      ├── Daily Deliverables Grouping (Tasks grouped by due date/assignment date)
       │      ├── Interactive Date Stepper (Previous Day, Today, Next Day, Native Date Picker)
       │      ├── Active Assignment Dates Ribbon (Clickable date chips showing active task counts)
       │      ├── Multi-Assignee Dropdown Filter (Filter day's tasks by individual member)
       │      └── Assignee Quick-Filter Avatar Pills
       │
       ├──> /teams (Organizational Department & Team Management)
       │      ├── Team Cards with Member Avatars & Active Task Counts
       │      ├── Team Creation & Editing Modal (Admin & Manager)
       │      ├── Team Roster Management (Add/Remove members by Manager/Admin)
       │      └── Team-specific Task View
       │
       ├──> /notifications (In-App Event Alerts & Inbox)
       │      ├── Instant Task Assignment & Status Update Alerts
       │      ├── Real-Time Navbar Badge Synchronization (Angular Signal)
       │      ├── Single Click "Mark as Read" & Batch "Mark All as Read"
       │      └── Deep-link navigation to relevant tasks
       │
       └──> [ ADMIN TOOLS (Protected by RoleGuard: Admin Only) ]
              │
              ├──> /users (Enterprise User Directory)
              │      ├── Enrolled Employee Accounts Table
              │      ├── Role Privileges Badges (Admin, Manager, User)
              │      ├── Admin-Only Audit Columns: Account Status, Soft Delete flag, Remarks
              │      └── Quick Action: "Register New User" button
              │
              └──> /register-user (Administrative User Provisioning)
                     ├── Provision new employee accounts with Full Name, Email, Role, Password
                     ├── Password Eye Toggle (Show/Hide)
                     ├── Live Password Complexity Validation Checklist
                     ├── Administrative Remarks Field (Department/onboarding notes)
                     └── Session Preservation: Keeps Administrator logged in without session eviction
```

---

## 👥 Part 2: Role-Based Access Control (RBAC) Matrix

| Feature / Screen | Administrator (`Admin`) | Team Manager (`Manager`) | Team Member (`User`) |
|---|:---:|:---:|:---:|
| **View Dashboard & KPI Telemetry** | Full System View | Team Scope | Assigned Task Scope |
| **Tasks: View Assigned & Team Items** | Allowed | Allowed | Allowed |
| **Tasks: Create New Work Items** | Allowed | Allowed | Restricted |
| **Tasks: Edit & Delete Work Items** | Allowed | Allowed | Restricted |
| **Tasks: Fast Status Progression** | Allowed | Allowed | Allowed (Own Tasks) |
| **Tasks: Collaboration Comments** | Allowed | Allowed | Allowed |
| **Schedule & Timeline Page** | Allowed | Allowed | Allowed |
| **Teams: Create & Manage Teams** | Allowed | Allowed | View Only |
| **Teams: Add & Remove Members** | Allowed | Allowed | Restricted |
| **Admin Audit Fields (`Remarks`, `IsDeleted`, `CreatedDate`, `CreatedById`)** | **Visible** | **Hidden** | **Hidden** |
| **User Directory (`/users`)** | Allowed | Restricted | Restricted |
| **Register New Users (`/register-user`)** | Allowed | Restricted | Restricted |

---

## 🏛️ Part 3: Backend Architecture & Codebase Tour

The backend is built following standard clean architecture patterns inside `Backend/ManagementSystem/`:

```
Backend/ManagementSystem/
│
├── Controllers/                  # RESTful API Endpoints
│   ├── AuthController.cs         # /api/auth (Login, Register, Current Profile, User Directory)
│   ├── TasksController.cs        # /api/tasks (CRUD, Kanban Status Patch, Filter Search)
│   ├── TeamsController.cs        # /api/teams (CRUD, Team Rosters, Member Enrollment)
│   ├── DashboardController.cs    # /api/dashboard (Aggregated KPI Telemetry & Chart Data)
│   ├── NotificationsController.cs# /api/notifications (User Alerts & Batch Read Synchronization)
│   └── CommentsController.cs     # /api/tasks/{id}/comments (Task Discussion Collaboration)
│
├── Services/                     # Business Logic Layer (.AsNoTracking() & Transactions)
│   ├── AuthService.cs            # Salted BCrypt Verification, JWT Issuance, Email Collision Safety
│   ├── TaskService.cs            # Task Lifecycle, Soft Deletes, Query Filter Pipelines
│   ├── TeamService.cs            # Team Partitioning, Roster Validation, Soft Deletes
│   └── NotificationService.cs    # Automated Event Triggers for Assignments & Status Transitions
│
├── Models/                       # Entity Framework Core Database Entities
│   ├── BaseEntity.cs             # Reusable Audit Columns (Remarks, Status, IsDeleted, CreatedDate, CreatedById)
│   ├── User.cs                   # Identity Model & UserRole Enum (Admin, Manager, User)
│   ├── TaskItem.cs               # Work Package Model, TaskStatusEnum, TaskPriorityEnum
│   ├── Team.cs                   # Organizational Department Model
│   ├── TeamMember.cs             # Many-to-Many Join Entity for Team Rosters
│   ├── TaskComment.cs            # Discussion Thread Entity
│   └── Notification.cs           # User Notification Entity
│
├── DTOs/                         # Data Transfer Objects (Strict Input Validation)
│   ├── AuthDTOs.cs               # Login, Registration, and User Token Models
│   ├── TaskDTOs.cs               # CreateTask, UpdateTask, TaskFilter, StatusPatch Models
│   ├── TeamDTOs.cs               # CreateTeam, TeamSummary Models
│   ├── DashboardDTOs.cs          # KPI Aggregation Summary Models
│   └── NotificationDTOs.cs       # Notification Response Models
│
├── Data/                         # Data Persistence & Migration
│   ├── AppDbContext.cs           # EF Core Context with Global Soft-Delete Query Filters
│   └── DbInitializer.cs          # Automated Baseline Database Seeding (Admin, Manager, Users, Teams, Tasks)
│
├── Helpers/                      # Cross-Cutting Infrastructure
│   ├── JwtHelper.cs              # HMAC-SHA256 Token Creation & Claims Identity Signing
│   └── PasswordHasher.cs         # BCrypt Password Hashing with Work Factor 12
│
├── database_schema.sql           # Complete Enterprise DDL with 6 Non-Clustered Performance Indexes
├── stored_procedures.sql         # 16 Production Stored Procedures with Atomic Transactions
└── Program.cs                    # ASP.NET Core 8 Hosting, Kestrel Port 5000 Binding, CORS & Pipeline
```

---

## 💾 Part 4: Database Schema & High-Performance Index Map

The database is deployed on Microsoft SQL Server 2025 (`localhost\SQLEXPRESS`) under database `ManagementSystem`:

### 1. Database Tables & Key Foreign Keys
* **`Users`**: Holds employee credentials, BCrypt hashes, system roles (`1=Admin, 2=Manager, 3=User`), and audit tracking.
* **`Teams`**: Department groupings with designated `ManagerId` foreign key.
* **`TeamMembers`**: Many-to-many junction joining `TeamId` and `UserId`.
* **`Tasks`**: Primary work packages with foreign keys to `TeamId`, `AssignedToUserId`, and `CreatedById`.
* **`Comments`**: Discussion threads referencing `TaskId` and `UserId`.
* **`Notifications`**: User alerts referencing `UserId` and `RelatedTaskId`.

### 2. Non-Clustered Indexes (Performance Optimization)
* `IX_Tasks_Status_DueDate`: Accelerates Dashboard KPI calculations and overdue task detection.
* `IX_Tasks_AssignedToUserId`: Guarantees sub-millisecond lookups for user-assigned tasks and timeline filtering.
* `IX_Tasks_TeamId`: Accelerates departmental task filtering and Kanban column loading.
* `IX_TeamMembers_UserId`: Optimizes user team membership lookups during authorization checks.
* `IX_Comments_TaskId`: Ensures instantaneous loading of task discussion threads.
* `IX_Notifications_UserId_IsRead`: Accelerates unread notification badge counts.

---

## ⚡ Part 5: How to Run the Project (Step-by-Step Guide)

### Terminal 1: Launch Backend Web API (.NET 8)
```powershell
cd c:\Users\Prash\Desktop\Project\Backend\ManagementSystem
dotnet run --launch-profile http
```
* **API Root**: `http://localhost:5000`
* **Swagger API Documentation**: `http://localhost:5000/swagger`

### Terminal 2: Launch Frontend Application (Angular 19)
```powershell
cd c:\Users\Prash\Desktop\Project\Frontend\ManagementSystemUI
npm start
```
* **Web UI Application**: `http://localhost:4200`

---

## 🎤 Part 6: Presentation & Interview Speaking Guide (3+ Years Experience Tone)

When presenting this project to reviewers or technical evaluators, use the following key architectural highlights:

1. **Clean Architectural Separation**:
   > *"I structured the backend with a strict separation of concerns: REST API Controllers handle HTTP requests and model validation, dedicated Services encapsulate domain logic with EF Core, and DTOs enforce strict data contracts between client and server."*

2. **Database Performance Optimization**:
   > *"Rather than relying on basic table scans, I added 6 strategic Non-Clustered Indexes targeting frequently queried columns like `(Status, DueDate)` and `AssignedToUserId`. In EF Core queries, I enforced `.AsNoTracking()` on all read paths to minimize memory allocation and maximize throughput."*

3. **Enterprise Soft Deletion**:
   > *"All business entities inherit from `BaseEntity`. Instead of physical data loss, records use logical soft-deletion (`IsDeleted`). In `AppDbContext`, I configured global query filters (`HasQueryFilter(e => !e.IsDeleted)`) so deleted records never leak into API queries, while `IgnoreQueryFilters()` is used selectively to prevent unique constraint collisions."*

4. **Security & Authentication**:
   > *"Authentication uses stateless JWT bearer tokens with HMAC-SHA256 encryption. User passwords are encrypted using BCrypt with a cost factor of 12. Endpoints enforce Role-Based Access Control (RBAC) across Administrator, Manager, and User roles. Sensitive audit tracking columns are restricted exclusively to administrators."*

5. **Modern Frontend (Angular 19 Standalone & Signals)**:
   > *"The frontend is built using Angular 19 standalone components and Angular Signals for lightweight, reactive state management without Zone.js overhead. I implemented custom HTTP interceptors for automatic JWT attachment and 401/403 session expiration handling, and customized the style budgets to ensure zero build warnings."*
