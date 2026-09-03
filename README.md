# 🚀 WorkFlow Pro - Team & Task Management System

A full-stack, enterprise-grade **Team & Task Management System** built with **ASP.NET Core 8 Web API**, **Entity Framework Core**, **SQL Server**, and **Angular 19**.

---

## 🌟 Key Features

### 1. Role-Based Access Control (RBAC)
* 👑 **Admin**: Full oversight over teams, manager assignments, users directory, and global task creation.
* 👔 **Manager**: Create, edit, and assign tasks to team members; organize and manage teams.
* 👤 **User (Employee/Member)**: View assigned tasks, update task statuses (`To Do` ➔ `In Progress` ➔ `Done`), post comments, and receive notifications.

### 2. Core Functionalities
* 🔐 **Authentication & Authorization**: Secure JWT authentication, BCrypt password hashing, session expiry handling.
* 📋 **Task Management**: Title, description, status (`To Do`, `In Progress`, `Done`), priority (`Low`, `Medium`, `High`, `Urgent`), team assignment, assignee, and due date.
* 📊 **Kanban Board & Table View**: Interactive drag/shift Kanban board and searchable/filterable table.
* 📅 **Date-Wise Schedule & Timeline (`/schedule`)**: Deliverables grouped by assignment/due date, previous/next day navigation, active dates ribbon, and multi-user dropdown filtering.
* 🛡️ **Admin-Only Audit Tracking**: Privileged system tracking fields (`Remarks`, `Workflow Status Code`, `IsDeleted`, `CreatedDate (UTC)`, `LastUpdatedDate`, `CreatedById`) visible strictly to Administrator role.
* 💬 **Collaboration & Comments**: Discussion thread on every task with author roles and timestamps.
* 🔔 **Real-Time & Mock Notifications**: Automated in-app alerts and logged email dispatches when tasks are assigned or updated.
* 📈 **Analytics Dashboard**: Overview metrics cards, priority distribution bars, overdue alerts, and recent activities.
* 📑 **Architecture Guide & Postman Collection**: Comprehensive [PROJECT_MAP.md](file:///c:/Users/Prash/Desktop/Project/PROJECT_MAP.md) and ready-to-import `ManagementSystem_Postman_Collection.json`.

---

## 🔑 Pre-Configured Demo Credentials

The database automatically seeds these accounts on first startup:

| Role | Email | Password | Permissions |
|---|---|---|---|
| **Admin** | `admin@system.com` | `Admin@123` | Full system access, all teams & users |
| **Manager** | `manager@system.com` | `Manager@123` | Manage teams, assign tasks to members |
| **User (Developer)** | `rahul@system.com` | `User@123` | View assigned tasks, move status, comment |
| **User (Designer)** | `priya@system.com` | `User@123` | View assigned tasks, move status, comment |
| **User (QA)** | `user@system.com` | `User@123` | View assigned tasks, move status, comment |

> 💡 *Note: The Login page also features **1-Click Quick Demo Login buttons** for instant testing!*

---

## 🛠️ Technology Stack

* **Backend**: ASP.NET Core 8 Web API (.NET 8.0)
* **ORM & Database**: Entity Framework Core 8.0, Microsoft SQL Server
* **Authentication**: JWT Bearer Tokens + BCrypt.Net
* **Frontend**: Angular 19 (Standalone Components, Signals, Reactive Forms, Interceptors)
* **Design & Styling**: Custom Responsive Design System (CSS3 Variables, Glassmorphism, Micro-animations)
* **API Documentation**: Swagger / OpenAPI (with Bearer Token support)
* **DevOps**: Docker, Docker Compose, GitHub Actions CI/CD

---

## 🚀 Running the Application Locally

### Prerequisites
* [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
* [Node.js](https://nodejs.org/) (v18 or higher)
* [SQL Server](https://www.microsoft.com/sql-server/) (or LocalDB / SQL Express)

---

### Step 1: Start the Backend Web API
1. Navigate to the backend directory:
   ```bash
   cd Backend/ManagementSystem
   ```
2. Verify or update connection string in `appsettings.json` if needed:
   ```json
   "ConnectionStrings": {
     "DefaultConnection": "Server=localhost\\SQLEXPRESS;Database=ManagementSystem;Trusted_Connection=True;TrustServerCertificate=True;"
   }
   ```
3. Run the backend:
   ```bash
   dotnet run
   ```
4. Backend will start at:
   * **API Base URL**: `http://localhost:5000` (or `https://localhost:7xxx`)
   * **Swagger Documentation**: `http://localhost:5000/swagger`

---

### Step 2: Start the Angular 19 Frontend
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd Frontend/ManagementSystemUI
   ```
2. Install dependencies (if not already installed):
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm start
   ```
4. Open your browser and navigate to:
   * **Frontend Application**: `http://localhost:4200`

---

## 🐳 Dockerized Setup (Multi-Container Architecture)

To run the entire stack (SQL Server, Backend Web API, and Angular UI) with one command:

```bash
docker-compose up --build
```

Services will be available at:
* **Frontend**: `http://localhost:4200`
* **Backend API**: `http://localhost:5000`
* **Swagger**: `http://localhost:5000/swagger`
* **SQL Server**: `localhost:1433`

---

## 📚 API Endpoints Summary

### Authentication (`/api/auth`)
* `POST /api/auth/register` - Register a new user
* `POST /api/auth/login` - Authenticate and get JWT token
* `GET /api/auth/me` - Get current logged-in user details
* `GET /api/auth/users` - Get all users (for assignment dropdowns)

### Tasks (`/api/tasks`)
* `GET /api/tasks` - List tasks with search, status, priority, and overdue filters
* `GET /api/tasks/{id}` - Get task details
* `POST /api/tasks` - Create a new task *(Admin & Manager)*
* `PUT /api/tasks/{id}` - Update a task *(Admin & Manager)*
* `PATCH /api/tasks/{id}/status` - Update task status (`ToDo`, `InProgress`, `Done`)
* `DELETE /api/tasks/{id}` - Delete a task *(Admin & Manager)*

### Comments (`/api/tasks/{taskId}/comments`)
* `GET /api/tasks/{taskId}/comments` - Get discussion comments on a task
* `POST /api/tasks/{taskId}/comments` - Add a comment to a task

### Teams (`/api/teams`)
* `GET /api/teams` - List teams and members
* `POST /api/teams` - Create a team *(Admin & Manager)*
* `POST /api/teams/{id}/members` - Add user to team *(Admin & Manager)*
* `DELETE /api/teams/{id}/members/{userId}` - Remove user from team *(Admin & Manager)*
* `DELETE /api/teams/{id}` - Delete team *(Admin)*

### Notifications & Dashboard
* `GET /api/notifications` - Get user notifications and unread count
* `PATCH /api/notifications/{id}/read` - Mark notification as read
* `PATCH /api/notifications/read-all` - Mark all notifications as read
* `GET /api/dashboard/stats` - Get summary metrics and chart distribution
