import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TaskService } from '../../core/services/task.service';
import { AuthService } from '../../core/services/auth.service';
import { DashboardSummary } from '../../core/models/dashboard.model';
import { StatCardComponent } from '../../components/ui/stat-card.component';
import { StatusBadgeComponent } from '../../components/ui/status-badge.component';
import { SkeletonLoaderComponent } from '../../components/ui/skeleton-loader.component';
import { EmptyStateComponent } from '../../components/ui/empty-state.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    StatCardComponent, 
    StatusBadgeComponent, 
    SkeletonLoaderComponent, 
    EmptyStateComponent
  ],
  template: `
    <div class="dashboard-page">
      <!-- Top Welcome Banner -->
      <div class="welcome-card">
        <div class="welcome-content">
          <div class="welcome-badge-row">
            <span class="role-pill-badge">
              <i class="fa-solid fa-shield-halved" *ngIf="authService.isAdmin()"></i>
              <i class="fa-solid fa-user-tie" *ngIf="authService.isManager()"></i>
              <i class="fa-solid fa-user" *ngIf="!authService.isAdmin() && !authService.isManager()"></i>
              {{ authService.userRole() }} Workspace
            </span>
            <span class="greeting-pill"><i class="fa-regular fa-sun"></i> {{ getTimeGreeting() }}</span>
          </div>
          <h2>Welcome, {{ authService.currentUser()?.fullName }} 👋</h2>
          <p>Here is your real-time management control center. Monitor team productivity, workflows, and task execution.</p>
        </div>
        <div class="welcome-actions">
          <a routerLink="/tasks" class="btn btn-primary-glass">
            <i class="fa-solid fa-table-columns"></i> Open Kanban
          </a>
          <a routerLink="/schedule" class="btn btn-secondary-glass">
            <i class="fa-regular fa-calendar-days"></i> Timeline Schedule
          </a>
        </div>
      </div>

      <!-- Quick Action Launchpad -->
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

      <!-- Loading Skeleton State -->
      <app-skeleton-loader *ngIf="loading()" type="stats" [count]="5"></app-skeleton-loader>

      <!-- Stats Grid using Reusable StatCard Components -->
      <div class="stats-grid" *ngIf="!loading() && summary() as data">
        <app-stat-card
          label="Total Tasks"
          [value]="data.totalTasks"
          icon="fa-solid fa-list-ul"
          iconClass="icon-indigo"
          badgeText="Active"
          badgeClass="badge-primary"
          [subText]="'Assigned & Tracked'"
        ></app-stat-card>

        <app-stat-card
          label="To Do"
          [value]="data.toDoTasks"
          icon="fa-regular fa-circle-dot"
          iconClass="icon-slate"
          badgeText="Backlog"
          badgeClass="badge-primary"
          [subText]="'Pending start'"
        ></app-stat-card>

        <app-stat-card
          label="In Progress"
          [value]="data.inProgressTasks"
          icon="fa-solid fa-spinner fa-spin-pulse"
          iconClass="icon-cyan"
          badgeText="Ongoing"
          badgeClass="badge-warning"
          [subText]="'Under execution'"
        ></app-stat-card>

        <app-stat-card
          label="Completed"
          [value]="data.doneTasks"
          icon="fa-solid fa-circle-check"
          iconClass="icon-emerald"
          badgeText="Done"
          badgeClass="badge-success"
          trendText="100% Quality"
          [trendPositive]="true"
        ></app-stat-card>

        <app-stat-card
          label="Overdue Tasks"
          [value]="data.overdueTasks"
          icon="fa-solid fa-triangle-exclamation"
          iconClass="icon-rose"
          badgeText="Urgent"
          badgeClass="badge-danger"
          [trendPositive]="false"
          [trendText]="data.overdueTasks > 0 ? 'Requires Attention' : 'On Track'"
        ></app-stat-card>
      </div>

      <!-- Main Dashboard Content Split -->
      <div class="dashboard-split" *ngIf="!loading() && summary() as data">
        <!-- Left: Recent Tasks Table with Interactive Tabs -->
        <div class="card recent-tasks-card">
          <div class="card-header flex-header">
            <div class="header-title-box">
              <i class="fa-solid fa-clock-rotate-left text-primary"></i>
              <h3>Recent Tasks Activity</h3>
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
              <table class="custom-table" *ngIf="getFilteredRecentTasks().length > 0">
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
                        <span class="task-main-title">{{ t.title }}</span>
                        <span *ngIf="t.teamName" class="task-team-tag">
                          <i class="fa-solid fa-users"></i> {{ t.teamName }}
                        </span>
                      </div>
                    </td>
                    <td>
                      <app-status-badge type="status" [value]="t.status"></app-status-badge>
                    </td>
                    <td>
                      <app-status-badge type="priority" [value]="t.priority"></app-status-badge>
                    </td>
                    <td>
                      <div class="assignee-cell">
                        <div class="avatar-small">
                          {{ (t.assignedToUserName || 'U').charAt(0).toUpperCase() }}
                        </div>
                        <span class="assignee-text">{{ t.assignedToUserName || 'Unassigned' }}</span>
                      </div>
                    </td>
                    <td>
                      <span [class.text-danger]="isOverdue(t.dueDate, t.status)" class="date-chip">
                        <i class="fa-regular fa-calendar"></i>
                        {{ t.dueDate ? (t.dueDate | date:'mediumDate') : 'No deadline' }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>

              <app-empty-state
                *ngIf="getFilteredRecentTasks().length === 0"
                icon="fa-regular fa-clipboard"
                title="No Tasks in this Category"
                description="There are no recent tasks matching this status filter."
                actionLabel="Create Task"
                actionIcon="fa-solid fa-plus"
                (actionClicked)="navigateToTasks()"
              ></app-empty-state>
            </div>
          </div>
        </div>

        <!-- Right Column: Priority & Notifications -->
        <div class="dashboard-side-col">
          <!-- Priority Distribution -->
          <div class="card">
            <div class="card-header">
              <div class="header-title-box">
                <i class="fa-solid fa-chart-pie text-indigo"></i>
                <h3>Priority Breakdown</h3>
              </div>
            </div>
            <div class="card-body">
              <div class="priority-list">
                <div *ngFor="let p of data.tasksByPriority" class="priority-item">
                  <div class="priority-info">
                    <span class="priority-name">
                      <app-status-badge type="priority" [value]="p.priority" [size]="'sm'"></app-status-badge>
                    </span>
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
                <h3>Latest Broadcasts</h3>
              </div>
            </div>
            <div class="card-body" style="padding: 1rem;">
              <div class="activity-feed">
                <div *ngFor="let n of data.recentNotifications" class="activity-item">
                  <div class="activity-dot"></div>
                  <div class="activity-content">
                    <h5>{{ n.title }}</h5>
                    <p>{{ n.message }}</p>
                    <span class="activity-time">
                      <i class="fa-regular fa-clock"></i> {{ n.createdAt | date:'short' }}
                    </span>
                  </div>
                </div>
                <div *ngIf="data.recentNotifications.length === 0" class="empty-activity">
                  <i class="fa-regular fa-bell-slash"></i>
                  <span>No recent activities or alerts.</span>
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
      border-radius: var(--radius-xl, 20px);
      padding: 2.25rem;
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1.5rem;
      box-shadow: 0 12px 30px -5px rgba(49, 46, 129, 0.35);
      position: relative;
      overflow: hidden;
    }

    .welcome-card::after {
      content: '';
      position: absolute;
      right: -40px;
      bottom: -40px;
      width: 220px;
      height: 220px;
      background: radial-gradient(circle, rgba(255, 255, 255, 0.08) 0%, transparent 70%);
      border-radius: 50%;
      pointer-events: none;
    }

    .welcome-badge-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 0.5rem;
    }

    .role-pill-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.3rem 0.85rem;
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(8px);
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .greeting-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      background: rgba(253, 230, 138, 0.2);
      color: #fef08a;
      padding: 0.3rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
      border: 1px solid rgba(253, 230, 138, 0.3);
    }

    .welcome-content h2 {
      font-size: 1.75rem;
      font-weight: 800;
      margin: 0.25rem 0 0.5rem 0;
      letter-spacing: -0.02em;
    }

    .welcome-content p {
      font-size: 0.9375rem;
      color: #c7d2fe;
      margin: 0;
      max-width: 620px;
      line-height: 1.5;
    }

    .welcome-actions {
      display: flex;
      gap: 0.875rem;
      flex-shrink: 0;
    }

    .btn-primary-glass {
      background: #ffffff;
      color: #312e81;
      padding: 0.75rem 1.35rem;
      border-radius: 10px;
      font-weight: 700;
      font-size: 0.875rem;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
      transition: all 0.2s ease;
    }

    .btn-primary-glass:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
      background: #f8fafc;
    }

    .btn-secondary-glass {
      background: rgba(255, 255, 255, 0.15);
      color: #ffffff;
      padding: 0.75rem 1.35rem;
      border-radius: 10px;
      font-weight: 600;
      font-size: 0.875rem;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      border: 1px solid rgba(255, 255, 255, 0.25);
      backdrop-filter: blur(8px);
      transition: all 0.2s ease;
    }

    .btn-secondary-glass:hover {
      background: rgba(255, 255, 255, 0.25);
      transform: translateY(-2px);
    }

    /* Quick Launchpad */
    .quick-launchpad {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
      gap: 1rem;
    }

    .launchpad-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 1.125rem 1.25rem;
      display: flex;
      align-items: center;
      gap: 0.875rem;
      text-decoration: none;
      color: inherit;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .launchpad-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.06);
      border-color: #6366f1;
    }

    .launchpad-icon {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
      flex-shrink: 0;
    }

    .icon-tasks { background: #eef2ff; color: #4f46e5; }
    .icon-calendar { background: #f0fdf4; color: #16a34a; }
    .icon-teams { background: #fdf4ff; color: #c026d3; }
    .icon-admin-tool { background: #f5f3ff; color: #7c3aed; }
    .icon-notif { background: #fffbeb; color: #d97706; }

    .launchpad-info h4 {
      font-size: 0.9375rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 0.125rem 0;
    }

    .launchpad-info p {
      font-size: 0.75rem;
      color: #64748b;
      margin: 0;
    }

    .launchpad-arrow {
      margin-left: auto;
      color: #94a3b8;
      font-size: 0.875rem;
      transition: transform 0.2s ease, color 0.2s ease;
    }

    .launchpad-card:hover .launchpad-arrow {
      color: #4f46e5;
      transform: translateX(4px);
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
      gap: 1.25rem;
    }

    .dashboard-split {
      display: grid;
      grid-template-columns: 2.2fr 1fr;
      gap: 1.5rem;
    }

    @media (max-width: 1024px) {
      .dashboard-split {
        grid-template-columns: 1fr;
      }
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

    .card {
      background: #ffffff;
      border-radius: 16px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.05);
      overflow: hidden;
    }

    .card-header {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid #f1f5f9;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .flex-header {
      flex-wrap: wrap;
      gap: 1rem;
    }

    .header-title-box {
      display: flex;
      align-items: center;
      gap: 0.625rem;
    }

    .header-title-box h3 {
      font-size: 1.05rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
    }

    .text-primary { color: #4f46e5; }
    .text-indigo { color: #6366f1; }
    .text-warning { color: #f59e0b; }

    .task-tabs-strip {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      background: #f1f5f9;
      padding: 0.25rem;
      border-radius: 8px;
    }

    .tab-pill {
      background: none;
      border: none;
      padding: 0.4rem 0.85rem;
      border-radius: 6px;
      font-size: 0.775rem;
      font-weight: 600;
      color: #64748b;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .tab-pill:hover {
      color: #0f172a;
    }

    .tab-pill.active {
      background: #ffffff;
      color: #4f46e5;
      font-weight: 700;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
    }

    .custom-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
    }

    .custom-table th {
      background: #f8fafc;
      padding: 0.875rem 1.25rem;
      font-weight: 700;
      color: #475569;
      text-transform: uppercase;
      font-size: 0.725rem;
      letter-spacing: 0.05em;
      border-bottom: 1px solid #e2e8f0;
      text-align: left;
    }

    .custom-table td {
      padding: 1rem 1.25rem;
      border-bottom: 1px solid #f1f5f9;
      color: #1e293b;
      vertical-align: middle;
    }

    .custom-table tr:hover td {
      background: #f8fafc;
    }

    .task-title-cell {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .task-main-title {
      font-weight: 700;
      color: #0f172a;
    }

    .task-team-tag {
      font-size: 0.725rem;
      color: #4f46e5;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
    }

    .assignee-cell {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .avatar-small {
      width: 26px;
      height: 26px;
      border-radius: 50%;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: #ffffff;
      font-size: 0.725rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .assignee-text {
      font-weight: 600;
      color: #334155;
    }

    .date-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.8125rem;
      color: #64748b;
    }

    .text-danger {
      color: #dc2626 !important;
      font-weight: 700;
    }

    .dashboard-side-col {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .priority-list {
      display: flex;
      flex-direction: column;
      gap: 1.125rem;
      padding: 1.25rem;
    }

    .priority-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.8125rem;
      font-weight: 600;
      margin-bottom: 0.375rem;
    }

    .priority-count {
      color: #64748b;
      font-size: 0.775rem;
    }

    .progress-bar-track {
      height: 7px;
      background: #f1f5f9;
      border-radius: 9999px;
      overflow: hidden;
    }

    .progress-bar-fill {
      height: 100%;
      border-radius: 9999px;
      transition: width 0.4s ease;
    }

    .fill-low { background: #94a3b8; }
    .fill-medium { background: #0284c7; }
    .fill-high { background: #ea580c; }
    .fill-urgent, .fill-critical { background: #e11d48; }

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
      border-radius: 50%;
      background: #4f46e5;
      margin-top: 0.375rem;
      flex-shrink: 0;
      box-shadow: 0 0 6px rgba(79, 70, 229, 0.4);
    }

    .activity-content h5 {
      font-size: 0.825rem;
      font-weight: 700;
      color: #1e293b;
      margin: 0 0 0.125rem 0;
    }

    .activity-content p {
      font-size: 0.75rem;
      color: #64748b;
      margin: 0 0 0.25rem 0;
      line-height: 1.4;
    }

    .activity-time {
      font-size: 0.7rem;
      color: #94a3b8;
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
    }

    .empty-activity {
      text-align: center;
      padding: 1.75rem;
      color: #94a3b8;
      font-size: 0.8125rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      align-items: center;
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
    if (!dueDate || status === 'Done' || status === 'Completed') return false;
    return new Date(dueDate) < new Date();
  }

  navigateToTasks() {
    window.location.href = '/tasks';
  }
}
