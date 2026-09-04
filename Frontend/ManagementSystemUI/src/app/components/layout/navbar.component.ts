import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <header class="navbar">
      <div class="navbar-left">
        <button class="mobile-toggle-btn" (click)="toggleMobileSidebar()">
          <i class="fa-solid fa-bars"></i>
        </button>
        <div class="page-title-wrap">
          <h1 class="page-header-title">Management Dashboard</h1>
          <span class="page-subtitle">Welcome back, {{ authService.currentUser()?.fullName }}</span>
        </div>
      </div>

      <div class="navbar-right">
        <!-- Live Notifications Dropdown Trigger -->
        <div class="notif-dropdown-wrapper">
          <button class="notif-btn" (click)="toggleNotifDropdown()">
            <i class="fa-regular fa-bell"></i>
            <span class="notif-badge" *ngIf="notificationService.unreadCount() > 0">
              {{ notificationService.unreadCount() }}
            </span>
          </button>

          <!-- Dropdown Popover -->
          <div class="notif-popover" *ngIf="isNotifOpen()">
            <div class="notif-popover-header">
              <h3>Notifications</h3>
              <button class="btn-text" (click)="notificationService.markAllAsRead().subscribe()">Mark all read</button>
            </div>
            <div class="notif-list">
              <div 
                *ngFor="let n of notificationService.notifications().slice(0, 6)" 
                class="notif-item" 
                [class.unread]="!n.isRead"
                (click)="markRead(n.id)"
              >
                <div class="notif-icon-circle">
                  <i *ngIf="n.type === 'TaskAssigned'" class="fa-solid fa-user-plus text-primary"></i>
                  <i *ngIf="n.type === 'StatusUpdated'" class="fa-solid fa-arrows-rotate text-info"></i>
                  <i *ngIf="n.type === 'CommentAdded'" class="fa-solid fa-comment-dots text-warning"></i>
                </div>
                <div class="notif-text">
                  <h5>{{ n.title }}</h5>
                  <p>{{ n.message }}</p>
                  <span class="time">{{ n.createdAt | date:'shortTime' }}</span>
                </div>
              </div>
              <div *ngIf="notificationService.notifications().length === 0" class="notif-empty">
                <i class="fa-regular fa-bell-slash"></i>
                <p>No notifications yet</p>
              </div>
            </div>
            <div class="notif-popover-footer">
              <a routerLink="/notifications" (click)="isNotifOpen.set(false)">View all notifications</a>
            </div>
          </div>
        </div>

        <!-- User Role Pill -->
        <div class="role-pill">
          <span class="role-dot" [ngClass]="'role-dot-' + (authService.userRole() | lowercase)"></span>
          <span class="role-name">{{ authService.userRole() }}</span>
        </div>

        <!-- User Profile Pill -->
        <div class="user-pill">
          <div class="avatar-small">
            {{ authService.currentUser()?.fullName?.charAt(0) }}
          </div>
          <span class="user-name">{{ authService.currentUser()?.fullName }}</span>
        </div>
      </div>
    </header>
  `,
  styles: [`
    .navbar {
      height: var(--header-height);
      background: #ffffff;
      border-bottom: 1px solid var(--slate-200);
      padding: 0 2rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: sticky;
      top: 0;
      z-index: 50;
      backdrop-filter: blur(8px);
      background: rgba(255, 255, 255, 0.95);
    }

    .navbar-left {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .mobile-toggle-btn {
      display: none;
      background: transparent;
      border: 1px solid var(--slate-200);
      border-radius: var(--radius-md);
      padding: 0.5rem 0.75rem;
      color: var(--slate-700);
      cursor: pointer;
    }

    @media (max-width: 1024px) {
      .mobile-toggle-btn {
        display: block;
      }
    }

    .page-header-title {
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--slate-900);
      margin: 0;
    }

    .page-subtitle {
      font-size: 0.75rem;
      color: var(--slate-500);
    }

    .navbar-right {
      display: flex;
      align-items: center;
      gap: 1.25rem;
    }

    .notif-dropdown-wrapper {
      position: relative;
    }

    .notif-btn {
      width: 40px;
      height: 40px;
      border-radius: var(--radius-full);
      background: var(--slate-100);
      border: 1px solid var(--slate-200);
      color: var(--slate-700);
      font-size: 1.125rem;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      position: relative;
      transition: all 0.2s;
    }

    .notif-btn:hover {
      background: var(--slate-200);
    }

    .notif-badge {
      position: absolute;
      top: -2px;
      right: -2px;
      background: var(--danger);
      color: #ffffff;
      font-size: 0.625rem;
      font-weight: 800;
      min-width: 18px;
      height: 18px;
      border-radius: var(--radius-full);
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid #ffffff;
    }

    .notif-popover {
      position: absolute;
      top: calc(100% + 10px);
      right: 0;
      width: 360px;
      background: #ffffff;
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-xl);
      border: 1px solid var(--slate-200);
      z-index: 1000;
      animation: slideUp 0.2s ease-out;
    }

    .notif-popover-header {
      padding: 0.875rem 1rem;
      border-bottom: 1px solid var(--slate-100);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .notif-popover-header h3 {
      font-size: 0.875rem;
      font-weight: 700;
      margin: 0;
    }

    .btn-text {
      background: none;
      border: none;
      color: var(--primary-600);
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
    }

    .notif-list {
      max-height: 320px;
      overflow-y: auto;
    }

    .notif-item {
      display: flex;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      border-bottom: 1px solid var(--slate-100);
      cursor: pointer;
      transition: background 0.15s;
    }

    .notif-item:hover {
      background: var(--slate-50);
    }

    .notif-item.unread {
      background: var(--primary-50);
    }

    .notif-icon-circle {
      width: 32px;
      height: 32px;
      border-radius: var(--radius-full);
      background: #ffffff;
      border: 1px solid var(--slate-200);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.875rem;
      flex-shrink: 0;
    }

    .notif-text h5 {
      font-size: 0.8125rem;
      font-weight: 600;
      margin: 0 0 0.125rem 0;
      color: var(--slate-900);
    }

    .notif-text p {
      font-size: 0.75rem;
      color: var(--slate-600);
      margin: 0 0 0.25rem 0;
      line-height: 1.3;
    }

    .notif-text .time {
      font-size: 0.6875rem;
      color: var(--slate-400);
    }

    .notif-empty {
      padding: 2rem;
      text-align: center;
      color: var(--slate-400);
      font-size: 0.875rem;
    }

    .notif-popover-footer {
      padding: 0.75rem;
      border-top: 1px solid var(--slate-100);
      text-align: center;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--primary-600);
    }

    .role-pill {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.375rem 0.75rem;
      background: var(--slate-100);
      border-radius: var(--radius-full);
      border: 1px solid var(--slate-200);
    }

    .role-dot {
      width: 8px;
      height: 8px;
      border-radius: var(--radius-full);
    }

    .role-dot-admin { background: #7c3aed; box-shadow: 0 0 6px #7c3aed; }
    .role-dot-manager { background: #0284c7; box-shadow: 0 0 6px #0284c7; }
    .role-dot-user { background: #10b981; box-shadow: 0 0 6px #10b981; }

    .role-name {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--slate-700);
    }

    .user-pill {
      display: flex;
      align-items: center;
      gap: 0.625rem;
    }

    .avatar-small {
      width: 36px;
      height: 36px;
      border-radius: var(--radius-full);
      background: linear-gradient(135deg, var(--primary-600), var(--primary-800));
      color: #ffffff;
      font-weight: 700;
      font-size: 0.875rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .user-name {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--slate-800);
    }

    @media (max-width: 640px) {
      .navbar {
        padding: 0 1rem;
      }
      .user-name, .role-pill {
        display: none;
      }
    }
  `]
})
export class NavbarComponent {
  authService = inject(AuthService);
  notificationService = inject(NotificationService);

  isNotifOpen = signal<boolean>(false);

  toggleNotifDropdown() {
    this.isNotifOpen.update(v => !v);
  }

  toggleMobileSidebar() {
    const sidebar = document.querySelector('.sidebar') as HTMLElement;
    if (sidebar) {
      sidebar.style.display = sidebar.style.display === 'flex' ? 'none' : 'flex';
    }
  }

  markRead(id: number) {
    this.notificationService.markAsRead(id).subscribe();
  }
}
