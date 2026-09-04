import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TaskService } from '../../core/services/task.service';
import { AuthService } from '../../core/services/auth.service';
import { DashboardSummary } from '../../core/models/dashboard.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="dashboard-page">
      <!-- Top Welcome Banner -->
      <div class="welcome-card">
        <div class="welcome-content">
          <div class="welcome-badge-row">
            <span class="role-pill-badge">{{ authService.userRole() }} Workspace</span>
            <span class="greeting-pill"><i class="fa-regular fa-sun"></i> {{ getTimeGreeting() }}</span>
          </div>
          <h2>Welcome, {{ authService.currentUser()?.fullName }} 👋</h2>
          <p>Here is your real-time management control center. Monitor progress, assignments, and workflows.</p>
        </div>
        <div class="welcome-actions">
          <a routerLink="/tasks" class="btn btn-primary">
            <i class="fa-solid fa-table-columns"></i> Open Kanban
          </a>
          <a routerLink="/schedule" class="btn btn-secondary">
            <i class="fa-regular fa-calendar-days"></i> Timeline Schedule
          </a>
        </div>
      </div>

      <!-- Quick Action Launchpad (User Friendly Shortcuts) -->
      <div class="quick-launchpad">
        <a routerLink="/tasks" class="launchpad-card">
          <div class="launchpad-icon icon-tasks">
            <i class="fa-solid fa-list-check"></i>
          </div>
          <div class="launchpad-info">
            <h4>Kanban Board</h4>
            <p>Drag, filter & track tasks</p>
          </div>
          <i class="fa-solid fa-arrow-right launchpad-arrow"></i>
        </a>

        <a routerLink="/schedule" class="launchpad-card">
          <div class="launchpad-icon icon-calendar">
            <i class="fa-regular fa-calendar-check"></i>
          </div>
          <div class="launchpad-info">
            <h4>Daily Schedule</h4>
            <p>Date-wise work timeline</p>
          </div>
          <i class="fa-solid fa-arrow-right launchpad-arrow"></i>
        </a>

        <a routerLink="/teams" class="launchpad-card">
          <div class="launchpad-icon icon-teams">
            <i class="fa-solid fa-users-rectangle"></i>
          </div>
          <div class="launchpad-info">
            <h4>Team Hub</h4>
            <p>Collaborate with members</p>
          </div>
          <i class="fa-solid fa-arrow-right launchpad-arrow"></i>
        </a>

        <a routerLink="/users" class="launchpad-card" *ngIf="authService.isAdmin()">
          <div class="launchpad-icon icon-admin-tool">
            <i class="fa-solid fa-shield-halved"></i>
          </div>
          <div class="launchpad-info">
            <h4>User Directory</h4>
            <p>Manage all accounts</p>
          </div>
          <i class="fa-solid fa-arrow-right launchpad-arrow"></i>
        </a>

        <a routerLink="/notifications" class="launchpad-card" *ngIf="!authService.isAdmin()">
          <div class="launchpad-icon icon-notif">
            <i class="fa-regular fa-bell"></i>
          </div>
          <div class="launchpad-info">
            <h4>Notifications</h4>
            <p>Recent activity alerts</p>
          </div>
          <i class="fa-solid fa-arrow-right launchpad-arrow"></i>
        </a>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading()" class="loading-state">
        <i class="fa-solid fa-spinner fa-spin"></i>
        <span>Loading analytics...</span>
      </div>

      <!-- Stats Grid -->
      <div class="stats-grid" *ngIf="summary() as data">
        <div class="stat-card">
          <div class="stat-icon icon-indigo">
            <i class="fa-solid fa-list-ul"></i>
          </div>
          <div class="stat-info">
            <span class="stat-label">Total Tasks</span>
            <h3 class="stat-value">{{ data.totalTasks }}</h3>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon icon-slate">
            <i class="fa-solid fa-circle-dot"></i>
          </div>
          <div class="stat-info">
            <span class="stat-label">To Do</span>
            <h3 class="stat-value">{{ data.toDoTasks }}</h3>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon icon-blue">
            <i class="fa-solid fa-spinner"></i>
          </div>
          <div class="stat-info">
            <span class="stat-label">In Progress</span>
            <h3 class="stat-value">{{ data.inProgressTasks }}</h3>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon icon-emerald">
            <i class="fa-solid fa-circle-check"></i>
          </div>
          <div class="stat-info">
            <span class="stat-label">Completed</span>
            <h3 class="stat-value">{{ data.doneTasks }}</h3>
          </div>
        </div>

        <div class="stat-card" [class.alert-overdue]="data.overdueTasks > 0">
          <div class="stat-icon icon-red">
            <i class="fa-solid fa-triangle-exclamation"></i>
          </div>
          <div class="stat-info">
            <span class="stat-label">Overdue</span>
            <h3 class="stat-value text-red">{{ data.overdueTasks }}</h3>
          </div>
        </div>
      </div>

      <!-- Main Dashboard Content Split -->
      <div class="dashboard-split" *ngIf="summary() as data">
        <!-- Left: Recent Tasks Table with Interactive Tabs -->
        <div class="card recent-tasks-card">
          <div class="card-header flex-header">
            <div class="header-title-box">
              <i class="fa-solid fa-clock-rotate-left text-primary"></i>
              <h3>Recent Tasks</h3>
            </div>
            
            <!-- Filter Tabs -->
            <div class="task-tabs-strip">
              <button 
                type="button" 
                class="tab-pill" 
                [class.active]="recentFilter() === 'all'"
                (click)="recentFilter.set('all')"
              >
                All ({{ data.recentTasks.length }})
              </button>
              <button 
                type="button" 
                class="tab-pill" 
                [class.active]="recentFilter() === 'ToDo'"
                (click)="recentFilter.set('ToDo')"
              >
                To Do ({{ getRecentCount('ToDo') }})
              </button>
              <button 
                type="button" 
                class="tab-pill" 
                [class.active]="recentFilter() === 'InProgress'"
                (click)="recentFilter.set('InProgress')"
              >
                In Progress ({{ getRecentCount('InProgress') }})
              </button>
              <button 
                type="button" 
                class="tab-pill" 
                [class.active]="recentFilter() === 'Done'"
                (click)="recentFilter.set('Done')"
              >
                Done ({{ getRecentCount('Done') }})
              </button>
            </div>
          </div>
          <div class="card-body" style="padding: 0;">
            <div class="table-responsive">
              <table class="custom-table">
                <thead>
                  <tr>
                    <th>Task</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Assignee</th>
                    <th>Due Date</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let t of getFilteredRecentTasks()">
                    <td>
                      <div class="task-title-cell">
                        <strong>{{ t.title }}</strong>
                        <span *ngIf="t.teamName" class="task-team-tag">{{ t.teamName }}</span>
                      </div>
                    </td>
                    <td>
                      <span class="badge" [ngClass]="'badge-' + (t.status | lowercase)">
                        {{ t.status }}
                      </span>
                    </td>
                    <td>
                      <span class="badge" [ngClass]="'badge-' + (t.priority | lowercase)">
                        {{ t.priority }}
                      </span>
                    </td>
                    <td>
                      <span class="assignee-text">{{ t.assignedToUserName || 'Unassigned' }}</span>
                    </td>
                    <td>
                      <span [class.text-danger]="isOverdue(t.dueDate, t.status)">
                        {{ t.dueDate ? (t.dueDate | date:'mediumDate') : 'No deadline' }}
                      </span>
                    </td>
                  </tr>
                  <tr *ngIf="getFilteredRecentTasks().length === 0">
                    <td colspan="5" class="empty-state-cell">
                      <div class="empty-filter-wrap">
                        <i class="fa-regular fa-clipboard"></i>
                        <span>No tasks match the selected filter.</span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Right Column: Priority & Activity -->
        <div class="dashboard-side-col">
          <!-- Priority Distribution -->
          <div class="card">
            <div class="card-header">
              <div class="header-title-box">
                <i class="fa-solid fa-chart-column text-indigo"></i>
                <h3>Priority Distribution</h3>
              </div>
            </div>
            <div class="card-body">
              <div class="priority-list">
                <div *ngFor="let p of data.tasksByPriority" class="priority-item">
                  <div class="priority-info">
                    <span class="priority-name">{{ p.priority }}</span>
                    <span class="priority-count">{{ p.count }} tasks</span>
                  </div>
                  <div class="progress-bar-track">
                    <div 
                      class="progress-bar-fill" 
                      [ngClass]="'fill-' + (p.priority | lowercase)"
                      [style.width.%]="data.totalTasks > 0 ? (p.count / data.totalTasks * 100) : 0"
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Recent Notifications Activity -->
          <div class="card">
            <div class="card-header">
              <div class="header-title-box">
                <i class="fa-solid fa-bell text-warning"></i>
                <h3>Latest Updates</h3>
              </div>
            </div>
            <div class="card-body" style="padding: 1rem;">
              <div class="activity-feed">
                <div *ngFor="let n of data.recentNotifications" class="activity-item">
                  <div class="activity-dot"></div>
                  <div class="activity-content">
                    <h5>{{ n.title }}</h5>
                    <p>{{ n.message }}</p>
                    <span class="activity-time">{{ n.createdAt | date:'short' }}</span>
                  </div>
                </div>
                <div *ngIf="data.recentNotifications.length === 0" class="empty-activity">
                  No recent activities.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-page {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .welcome-card {
      background: linear-gradient(135deg, #1e1b4b, #312e81 60%, #4338ca);
      border-radius: var(--radius-xl);
      padding: 2rem 2.25rem;
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1.5rem;
      box-shadow: 0 10px 25px -5px rgba(49, 46, 129, 0.4);
    }

    .welcome-badge-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 0.5rem;
    }

    .role-pill-badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      background: rgba(255, 255, 255, 0.15);
      border-radius: var(--radius-full);
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .greeting-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      background: rgba(253, 230, 138, 0.2);
      color: #fef08a;
      padding: 0.2rem 0.65rem;
      border-radius: var(--radius-full);
      font-size: 0.75rem;
      font-weight: 600;
    }

    /* Quick Launchpad */
    .quick-launchpad {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1rem;
    }

    .launchpad-card {
      background: #ffffff;
      border: 1px solid var(--slate-200);
      border-radius: var(--radius-lg);
      padding: 1rem 1.25rem;
      display: flex;
      align-items: center;
      gap: 0.875rem;
      text-decoration: none;
      color: inherit;
      box-shadow: var(--shadow-sm);
      transition: all 0.2s ease;
      position: relative;
    }

    .launchpad-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
      border-color: var(--primary-400);
    }

    .launchpad-icon {
      width: 44px;
      height: 44px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      flex-shrink: 0;
    }

    .icon-tasks {
      background: #eef2ff;
      color: #4f46e5;
    }

    .icon-calendar {
      background: #f0fdf4;
      color: #16a34a;
    }

    .icon-teams {
      background: #fdf4ff;
      color: #c026d3;
    }

    .icon-admin-tool {
      background: #f5f3ff;
      color: #7c3aed;
    }

    .icon-notif {
      background: #fffbeb;
      color: #d97706;
    }

    .launchpad-info h4 {
      font-size: 0.9375rem;
      font-weight: 700;
      color: var(--slate-900);
      margin: 0 0 0.125rem 0;
    }

    .launchpad-info p {
      font-size: 0.75rem;
      color: var(--slate-500);
      margin: 0;
    }

    .launchpad-arrow {
      margin-left: auto;
      color: var(--slate-300);
      font-size: 0.875rem;
      transition: transform 0.2s ease, color 0.2s ease;
    }

    .launchpad-card:hover .launchpad-arrow {
      color: var(--primary-600);
      transform: translateX(3px);
    }

    /* Flex Header & Tabs */
    .flex-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .task-tabs-strip {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      background: var(--slate-100);
      padding: 0.25rem;
      border-radius: var(--radius-md);
    }

    .tab-pill {
      background: none;
      border: none;
      padding: 0.35rem 0.75rem;
      border-radius: var(--radius-sm);
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--slate-600);
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .tab-pill:hover {
      color: var(--slate-900);
    }

    .tab-pill.active {
      background: #ffffff;
      color: var(--primary-700);
      font-weight: 700;
      box-shadow: var(--shadow-sm);
    }

    .empty-filter-wrap {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      color: var(--slate-400);
      padding: 1.5rem 0;
      font-size: 0.875rem;
    }

    .welcome-content h2 {
      font-size: 1.625rem;
      font-weight: 800;
      margin-bottom: 0.375rem;
    }

    .welcome-content p {
      font-size: 0.875rem;
      color: #c7d2fe;
    }

    .welcome-actions {
      display: flex;
      gap: 0.75rem;
      flex-shrink: 0;
    }

    @media (max-width: 768px) {
      .welcome-card {
        flex-direction: column;
        align-items: flex-start;
      }
      .welcome-actions {
        width: 100%;
      }
      .welcome-actions a {
        flex: 1;
      }
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.25rem;
    }

    .stat-card {
      background: #ffffff;
      border-radius: var(--radius-lg);
      padding: 1.25rem 1.5rem;
      border: 1px solid var(--slate-200);
      display: flex;
      align-items: center;
      gap: 1rem;
      box-shadow: var(--shadow-sm);
      transition: all 0.2s;
    }

    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }

    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: var(--radius-lg);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
    }

    .icon-indigo { background: #eef2ff; color: #4f46e5; }
    .icon-slate { background: #f1f5f9; color: #475569; }
    .icon-blue { background: #eff6ff; color: #2563eb; }
    .icon-emerald { background: #ecfdf5; color: #059669; }
    .icon-red { background: #fef2f2; color: #dc2626; }

    .stat-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--slate-500);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .stat-value {
      font-size: 1.5rem;
      font-weight: 800;
      color: var(--slate-900);
      margin: 0;
    }

    .text-red { color: #dc2626; }
    .alert-overdue { border-color: #fecaca; background: #fff5f5; }

    .dashboard-split {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 1.5rem;
    }

    @media (max-width: 1024px) {
      .dashboard-split {
        grid-template-columns: 1fr;
      }
    }

    .header-title-box {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .header-title-box h3 {
      font-size: 1rem;
      font-weight: 700;
      color: var(--slate-900);
      margin: 0;
    }

    .task-title-cell {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
    }

    .task-team-tag {
      font-size: 0.6875rem;
      color: var(--primary-600);
      font-weight: 600;
    }

    .assignee-text {
      font-weight: 600;
      color: var(--slate-700);
    }

    .empty-state-cell {
      text-align: center;
      padding: 2rem;
      color: var(--slate-400);
    }

    .dashboard-side-col {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .priority-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .priority-info {
      display: flex;
      justify-content: space-between;
      font-size: 0.8125rem;
      font-weight: 600;
      margin-bottom: 0.375rem;
    }

    .progress-bar-track {
      height: 8px;
      background: var(--slate-100);
      border-radius: var(--radius-full);
      overflow: hidden;
    }

    .progress-bar-fill {
      height: 100%;
      border-radius: var(--radius-full);
      transition: width 0.4s ease;
    }

    .fill-low { background: #94a3b8; }
    .fill-medium { background: #10b981; }
    .fill-high { background: #f59e0b; }
    .fill-urgent { background: #ef4444; }

    .activity-feed {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .activity-item {
      display: flex;
      gap: 0.75rem;
      position: relative;
    }

    .activity-dot {
      width: 10px;
      height: 10px;
      border-radius: var(--radius-full);
      background: var(--primary-500);
      margin-top: 0.375rem;
      flex-shrink: 0;
    }

    .activity-content h5 {
      font-size: 0.8125rem;
      font-weight: 700;
      color: var(--slate-800);
      margin: 0 0 0.125rem 0;
    }

    .activity-content p {
      font-size: 0.75rem;
      color: var(--slate-600);
      margin: 0 0 0.25rem 0;
    }

    .activity-time {
      font-size: 0.6875rem;
      color: var(--slate-400);
    }

    .empty-activity {
      text-align: center;
      padding: 1.5rem;
      color: var(--slate-400);
      font-size: 0.8125rem;
    }

    .loading-state {
      padding: 3rem;
      text-align: center;
      color: var(--slate-500);
      font-size: 1.125rem;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
    }
  `]
})
export class DashboardComponent implements OnInit {
  authService = inject(AuthService);
  taskService = inject(TaskService);

  summary = signal<DashboardSummary | null>(null);
  loading = signal(true);
  recentFilter = signal<'all' | 'ToDo' | 'InProgress' | 'Done'>('all');

  ngOnInit() {
    this.loadStats();
  }

  loadStats() {
    this.loading.set(true);
    this.taskService.getDashboardStats().subscribe({
      next: (res) => {
        this.summary.set(res);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  getTimeGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  }

  getRecentCount(status: string): number {
    const list = this.summary()?.recentTasks || [];
    return list.filter(t => t.status.toLowerCase() === status.toLowerCase()).length;
  }

  getFilteredRecentTasks() {
    const list = this.summary()?.recentTasks || [];
    const filter = this.recentFilter();
    if (filter === 'all') return list;
    return list.filter(t => t.status.toLowerCase() === filter.toLowerCase());
  }

  isOverdue(dueDate?: string, status?: string): boolean {
    if (!dueDate || status === 'Done') return false;
    return new Date(dueDate) < new Date();
  }
}
