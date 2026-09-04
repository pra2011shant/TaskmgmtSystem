import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <aside class="sidebar">
      <div class="sidebar-brand">
        <div class="brand-icon">
          <i class="fa-solid fa-layer-group"></i>
        </div>
        <div class="brand-text">
          <h2>WorkFlow<span>Pro</span></h2>
          <span class="badge badge-role" [ngClass]="'badge-role-' + (authService.userRole() | lowercase)">
            {{ authService.userRole() }}
          </span>
        </div>
      </div>

      <div class="sidebar-nav">
        <div class="nav-section-title">MAIN MENU</div>
        
        <a routerLink="/dashboard" routerLinkActive="active" class="nav-item">
          <i class="fa-solid fa-chart-pie"></i>
          <span>Dashboard</span>
        </a>

        <a routerLink="/tasks" routerLinkActive="active" class="nav-item">
          <i class="fa-solid fa-list-check"></i>
          <span>Tasks & Kanban</span>
        </a>

        <a routerLink="/schedule" routerLinkActive="active" class="nav-item">
          <i class="fa-solid fa-calendar-days"></i>
          <span>Schedule & Dates</span>
        </a>

        <a routerLink="/teams" routerLinkActive="active" class="nav-item">
          <i class="fa-solid fa-users-rectangle"></i>
          <span>Teams</span>
        </a>

        <a routerLink="/notifications" routerLinkActive="active" class="nav-item">
          <i class="fa-solid fa-bell"></i>
          <span>Notifications</span>
          <span class="count-badge" *ngIf="notificationService.unreadCount() > 0">
            {{ notificationService.unreadCount() }}
          </span>
        </a>

        <div class="nav-section-title" *ngIf="authService.isAdmin()">ADMIN TOOLS</div>
        <a routerLink="/users" routerLinkActive="active" class="nav-item" *ngIf="authService.isAdmin()">
          <i class="fa-solid fa-users-gear"></i>
          <span>User Directory</span>
        </a>
        <a routerLink="/register-user" routerLinkActive="active" class="nav-item" *ngIf="authService.isAdmin()">
          <i class="fa-solid fa-user-plus"></i>
          <span>Register User</span>
        </a>
      </div>

      <div class="sidebar-footer">
        <div class="user-profile-preview" *ngIf="authService.currentUser() as user">
          <div class="avatar">
            {{ user.fullName.charAt(0) }}
          </div>
          <div class="user-info">
            <h4>{{ user.fullName }}</h4>
            <p>{{ user.email }}</p>
          </div>
        </div>
        <div class="system-status-indicator">
          <span class="status-dot"></span>
          <span>API Connected & Online</span>
        </div>
        <button class="logout-btn" (click)="authService.logout()" title="Logout">
          <i class="fa-solid fa-right-from-bracket"></i>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  `,
  styles: [`
    .sidebar {
      position: fixed;
      top: 0;
      left: 0;
      bottom: 0;
      width: var(--sidebar-width);
      background: var(--slate-900);
      color: #ffffff;
      display: flex;
      flex-direction: column;
      z-index: 100;
      border-right: 1px solid var(--slate-800);
    }

    .sidebar-brand {
      padding: 1.5rem 1.25rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }

    .brand-icon {
      width: 40px;
      height: 40px;
      border-radius: var(--radius-lg);
      background: linear-gradient(135deg, var(--primary-500), var(--primary-700));
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      color: #ffffff;
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
    }

    .brand-text h2 {
      font-size: 1.125rem;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: -0.02em;
      margin: 0;
    }

    .brand-text span {
      color: var(--primary-400);
    }

    .sidebar-nav {
      flex: 1;
      padding: 1.5rem 0.875rem;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
    }

    .nav-section-title {
      font-size: 0.6875rem;
      font-weight: 700;
      color: var(--slate-500);
      letter-spacing: 0.08em;
      padding: 0.75rem 0.75rem 0.25rem;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.875rem;
      padding: 0.75rem 0.875rem;
      color: var(--slate-400);
      border-radius: var(--radius-md);
      font-size: 0.875rem;
      font-weight: 600;
      transition: all 0.2s ease;
      position: relative;
    }

    .nav-item i {
      font-size: 1rem;
      width: 20px;
      text-align: center;
    }

    .nav-item:hover {
      background: rgba(255, 255, 255, 0.06);
      color: #ffffff;
    }

    .nav-item.active {
      background: linear-gradient(135deg, var(--primary-600), var(--primary-700));
      color: #ffffff;
      box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
    }

    .count-badge {
      margin-left: auto;
      background: var(--danger);
      color: #ffffff;
      font-size: 0.6875rem;
      font-weight: 700;
      padding: 0.125rem 0.5rem;
      border-radius: var(--radius-full);
    }

    .sidebar-footer {
      padding: 1.25rem 1rem;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      background: rgba(0, 0, 0, 0.2);
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .user-profile-preview {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .avatar {
      width: 36px;
      height: 36px;
      border-radius: var(--radius-full);
      background: linear-gradient(135deg, #6366f1, #a855f7);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.875rem;
      color: #ffffff;
    }

    .user-info h4 {
      font-size: 0.8125rem;
      font-weight: 700;
      color: #ffffff;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 140px;
    }

    .user-info p {
      font-size: 0.6875rem;
      color: var(--slate-400);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 140px;
    }

    .system-status-indicator {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.35rem 0.5rem;
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.25);
      border-radius: var(--radius-sm);
      font-size: 0.6875rem;
      color: #6ee7b7;
      font-weight: 600;
    }

    .status-dot {
      width: 6px;
      height: 6px;
      background: #10b981;
      border-radius: var(--radius-full);
      box-shadow: 0 0 6px #10b981;
    }

    .logout-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      width: 100%;
      padding: 0.5rem;
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: #fca5a5;
      border-radius: var(--radius-md);
      font-size: 0.8125rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .logout-btn:hover {
      background: var(--danger);
      color: #ffffff;
    }
  `]
})
export class SidebarComponent {
  authService = inject(AuthService);
  notificationService = inject(NotificationService);

  ngOnInit() {
    if (this.authService.isAuthenticated()) {
      this.notificationService.loadNotifications().subscribe();
    }
  }
}
