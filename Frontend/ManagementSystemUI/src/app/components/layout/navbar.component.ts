import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { ToastService } from '../../core/services/toast.service';

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
          <div class="title-row">
            <div class="system-nav-icon">
              <span>⚡</span>
            </div>
            <h1 class="page-header-title">WorkFlow Pro</h1>
            <span class="active-badge"><i class="fa-solid fa-circle"></i> Live System</span>
          </div>
          <span class="page-subtitle">Welcome back, <strong>{{ authService.currentUser()?.fullName }}</strong></span>
        </div>
      </div>

      <div class="navbar-right">
        <!-- Quick Role Switcher Dropdown (User Defined Persona Switcher) -->
        <div class="persona-dropdown-wrap">
          <button class="persona-switch-btn" (click)="togglePersonaDropdown()" title="Switch Persona / Role">
            <i class="fa-solid fa-wand-magic-sparkles"></i>
            <span class="persona-text">Switch Persona:</span>
            <span class="role-badge" [ngClass]="'role-' + (authService.userRole() | lowercase)">
              {{ authService.userRole() }}
            </span>
            <i class="fa-solid fa-chevron-down caret-icon"></i>
          </button>

          <!-- Persona Popover -->
          <div class="persona-popover" *ngIf="isPersonaOpen()">
            <div class="popover-header">
              <h4><i class="fa-solid fa-users-gear"></i> Quick Role Switcher</h4>
              <span class="popover-sub">1-Click test any persona instantly</span>
            </div>
            <div class="persona-list">
              <button 
                type="button" 
                class="persona-card" 
                [class.current]="authService.isAdmin()"
                (click)="switchPersona('admin@system.com', 'Admin@123', 'Administrator')"
              >
                <div class="persona-icon icon-admin">
                  <i class="fa-solid fa-shield-halved"></i>
                </div>
                <div class="persona-details">
                  <div class="persona-name-row">
                    <strong>System Administrator</strong>
                    <span *ngIf="authService.isAdmin()" class="active-tag">Current</span>
                  </div>
                  <p>Full control over users, teams, settings & tasks</p>
                  <span class="persona-email">admin&#64;system.com</span>
                </div>
              </button>

              <button 
                type="button" 
                class="persona-card" 
                [class.current]="authService.isManager() && !authService.isAdmin()"
                (click)="switchPersona('manager@system.com', 'Manager@123', 'Project Manager')"
              >
                <div class="persona-icon icon-manager">
                  <i class="fa-solid fa-user-tie"></i>
                </div>
                <div class="persona-details">
                  <div class="persona-name-row">
                    <strong>Project Manager</strong>
                    <span *ngIf="authService.isManager() && !authService.isAdmin()" class="active-tag">Current</span>
                  </div>
                  <p>Create & assign tasks, manage teams and deadlines</p>
                  <span class="persona-email">manager&#64;system.com</span>
                </div>
              </button>

              <button 
                type="button" 
                class="persona-card" 
                [class.current]="!authService.isManager()"
                (click)="switchPersona('rahul@system.com', 'User@123', 'Team Member (Rahul)')"
              >
                <div class="persona-icon icon-user">
                  <i class="fa-solid fa-user"></i>
                </div>
                <div class="persona-details">
                  <div class="persona-name-row">
                    <strong>Team Member (Rahul)</strong>
                    <span *ngIf="!authService.isManager()" class="active-tag">Current</span>
                  </div>
                  <p>Execute assigned tasks, update Kanban status & comments</p>
                  <span class="persona-email">rahul&#64;system.com</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        <!-- Live Notifications Dropdown Trigger -->
        <div class="notif-dropdown-wrapper">
          <button class="notif-btn" (click)="toggleNotifDropdown()" title="Notifications">
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

        <!-- User Profile Pill -->
        <div class="user-pill">
          <div class="avatar-small">
            {{ authService.currentUser()?.fullName?.charAt(0) }}
          </div>
          <div class="user-meta">
            <span class="user-name">{{ authService.currentUser()?.fullName }}</span>
            <span class="user-role-text">{{ authService.userRole() }}</span>
          </div>
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

    .system-nav-icon {
      width: 32px;
      height: 32px;
      border-radius: var(--radius-md);
      background: linear-gradient(135deg, #6366f1, #4338ca);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px rgba(99, 102, 241, 0.35);
      font-size: 1rem;
      flex-shrink: 0;
    }

    .title-row {
      display: flex;
      align-items: center;
      gap: 0.625rem;
    }

    .active-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      background: #ecfdf5;
      color: #059669;
      font-size: 0.6875rem;
      font-weight: 700;
      padding: 0.15rem 0.5rem;
      border-radius: var(--radius-full);
      border: 1px solid #a7f3d0;
    }

    .active-badge i {
      font-size: 0.45rem;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0% { opacity: 1; }
      50% { opacity: 0.4; }
      100% { opacity: 1; }
    }

    /* Persona Switcher */
    .persona-dropdown-wrap {
      position: relative;
    }

    .persona-switch-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: linear-gradient(135deg, #f8fafc, #f1f5f9);
      border: 1px solid var(--slate-300);
      border-radius: var(--radius-full);
      padding: 0.375rem 0.875rem;
      cursor: pointer;
      box-shadow: var(--shadow-sm);
      transition: all 0.2s ease;
      color: var(--slate-700);
    }

    .persona-switch-btn:hover {
      background: #ffffff;
      border-color: var(--primary-400);
      box-shadow: 0 0 12px rgba(99, 102, 241, 0.2);
    }

    .persona-switch-btn i.fa-wand-magic-sparkles {
      color: var(--primary-600);
      font-size: 0.875rem;
    }

    .persona-text {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--slate-600);
    }

    .role-badge {
      padding: 0.15rem 0.5rem;
      border-radius: var(--radius-full);
      font-size: 0.6875rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .role-badge.role-admin {
      background: #f5f3ff;
      color: #7c3aed;
      border: 1px solid #ddd6fe;
    }

    .role-badge.role-manager {
      background: #f0f9ff;
      color: #0284c7;
      border: 1px solid #bae6fd;
    }

    .role-badge.role-user {
      background: #ecfdf5;
      color: #059669;
      border: 1px solid #a7f3d0;
    }

    .caret-icon {
      font-size: 0.625rem;
      color: var(--slate-400);
      margin-left: 0.125rem;
    }

    .persona-popover {
      position: absolute;
      top: calc(100% + 10px);
      right: 0;
      width: 330px;
      background: #ffffff;
      border-radius: var(--radius-xl);
      box-shadow: 0 20px 30px -10px rgba(0, 0, 0, 0.18), 0 0 0 1px rgba(0, 0, 0, 0.05);
      border: 1px solid var(--slate-200);
      z-index: 1000;
      padding: 0.875rem;
      animation: slideUp 0.18s ease-out;
    }

    .popover-header {
      padding: 0.375rem 0.5rem 0.75rem;
      border-bottom: 1px solid var(--slate-100);
      margin-bottom: 0.5rem;
    }

    .popover-header h4 {
      font-size: 0.875rem;
      font-weight: 800;
      color: var(--slate-900);
      margin: 0;
      display: flex;
      align-items: center;
      gap: 0.375rem;
    }

    .popover-header h4 i {
      color: var(--primary-600);
    }

    .popover-sub {
      font-size: 0.6875rem;
      color: var(--slate-500);
    }

    .persona-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .persona-card {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 0.75rem;
      border-radius: var(--radius-lg);
      border: 1px solid var(--slate-200);
      background: #ffffff;
      cursor: pointer;
      text-align: left;
      width: 100%;
      transition: all 0.15s ease;
    }

    .persona-card:hover {
      background: var(--slate-50);
      border-color: var(--primary-300);
      transform: translateY(-1px);
    }

    .persona-card.current {
      background: #f8fafc;
      border-color: var(--primary-500);
      box-shadow: 0 0 0 1px var(--primary-500);
    }

    .persona-icon {
      width: 36px;
      height: 36px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1rem;
      flex-shrink: 0;
    }

    .icon-admin {
      background: #f5f3ff;
      color: #7c3aed;
      border: 1px solid #ddd6fe;
    }

    .icon-manager {
      background: #f0f9ff;
      color: #0284c7;
      border: 1px solid #bae6fd;
    }

    .icon-user {
      background: #ecfdf5;
      color: #059669;
      border: 1px solid #a7f3d0;
    }

    .persona-details {
      flex: 1;
    }

    .persona-name-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.125rem;
    }

    .persona-name-row strong {
      font-size: 0.8125rem;
      color: var(--slate-900);
    }

    .active-tag {
      font-size: 0.625rem;
      font-weight: 700;
      background: var(--primary-100);
      color: var(--primary-700);
      padding: 0.1rem 0.35rem;
      border-radius: var(--radius-sm);
    }

    .persona-details p {
      font-size: 0.6875rem;
      color: var(--slate-500);
      margin: 0 0 0.25rem 0;
      line-height: 1.25;
    }

    .persona-email {
      font-size: 0.6875rem;
      font-family: var(--font-mono);
      color: var(--slate-400);
    }

    .user-pill {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      padding-left: 0.5rem;
      border-left: 1px solid var(--slate-200);
    }

    .user-meta {
      display: flex;
      flex-direction: column;
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
      font-size: 0.8125rem;
      font-weight: 700;
      color: var(--slate-800);
      line-height: 1.2;
    }

    .user-role-text {
      font-size: 0.6875rem;
      color: var(--slate-500);
    }

    @media (max-width: 768px) {
      .persona-text {
        display: none;
      }
      .user-meta {
        display: none;
      }
    }
  `]
})
export class NavbarComponent {
  authService = inject(AuthService);
  notificationService = inject(NotificationService);
  toast = inject(ToastService);
  router = inject(Router);

  isNotifOpen = signal<boolean>(false);
  isPersonaOpen = signal<boolean>(false);

  toggleNotifDropdown() {
    this.isNotifOpen.update(v => !v);
    if (this.isNotifOpen()) this.isPersonaOpen.set(false);
  }

  togglePersonaDropdown() {
    this.isPersonaOpen.update(v => !v);
    if (this.isPersonaOpen()) this.isNotifOpen.set(false);
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

  switchPersona(email: string, pass: string, roleName: string) {
    this.authService.login({ email, password: pass }).subscribe({
      next: (res) => {
        this.isPersonaOpen.set(false);
        this.toast.success(`Active persona switched to ${roleName}!`);
        // Reload location to trigger re-fetching across all components cleanly
        window.location.reload();
      },
      error: () => {
        this.toast.error(`Unable to switch to ${roleName}.`);
      }
    });
  }
}
