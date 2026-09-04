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
          <span class="role-pill-badge">{{ authService.userRole() }} Workspace</span>
          <h2>Hello, {{ authService.currentUser()?.fullName }} 👋</h2>
          <p>Here is an overview of your team's current tasks, progress, and upcoming deadlines.</p>
        </div>
        <div class="welcome-actions">
          <a routerLink="/tasks" class="btn btn-primary">
            <i class="fa-solid fa-list-check"></i> View All Tasks
          </a>
          <a routerLink="/teams" class="btn btn-secondary" *ngIf="authService.isManager()">
            <i class="fa-solid fa-users"></i> Manage Teams
          </a>
        </div>
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
        <!-- Left: Recent Tasks Table -->
        <div class="card recent-tasks-card">
          <div class="card-header">
            <div class="header-title-box">
              <i class="fa-solid fa-clock-rotate-left text-primary"></i>
              <h3>Recent Tasks</h3>
            </div>
            <a routerLink="/tasks" class="btn btn-secondary btn-sm">View Board</a>
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
                  <tr *ngFor="let t of data.recentTasks">
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
                  <tr *ngIf="data.recentTasks.length === 0">
                    <td colspan="5" class="empty-state-cell">No tasks recorded yet.</td>
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

    .role-pill-badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      background: rgba(255, 255, 255, 0.15);
      border-radius: var(--radius-full);
      font-size: 0.75rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
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

  isOverdue(dueDate?: string, status?: string): boolean {
    if (!dueDate || status === 'Done') return false;
    return new Date(dueDate) < new Date();
  }
}
