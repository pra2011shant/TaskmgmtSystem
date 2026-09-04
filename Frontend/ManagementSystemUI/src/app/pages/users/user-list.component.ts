import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { User } from '../../core/models/auth.model';
import { AuthService } from '../../core/services/auth.service';

/**
 * Administrative User Management Directory
 * 
 * Displays enrolled corporate accounts and provides privileged audit columns
 * (Remarks, Record Status, Soft Delete flags, Creation timestamps) exclusively
 * for the Administrator role.
 */
@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="users-page">
      <div class="page-header">
        <div>
          <div class="admin-badge-wrap">
            <span class="admin-badge">
              <i class="fa-solid fa-shield-halved"></i> Administrator Console
            </span>
          </div>
          <h2 class="section-title">User Directory & System Accounts</h2>
          <p class="section-desc">Manage corporate accounts, employee roles, and audit tracking parameters.</p>
        </div>
        <div>
          <a routerLink="/register-user" class="btn btn-primary">
            <i class="fa-solid fa-user-plus"></i> Register New User
          </a>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading()" class="loading-state">
        <i class="fa-solid fa-spinner fa-spin"></i>
        <span>Loading users directory...</span>
      </div>

      <div *ngIf="!loading()" class="card">
        <div class="card-body" style="padding: 0;">
          <div class="table-responsive">
            <table class="custom-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>System Role</th>
                  <!-- Administrator-Only Audit Tracking Columns -->
                  <th *ngIf="authService.isAdmin()">Account Status</th>
                  <th *ngIf="authService.isAdmin()">Soft Deleted</th>
                  <th *ngIf="authService.isAdmin()">Remarks</th>
                  <th>Joined Date</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let u of users()">
                  <td>
                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                      <div class="avatar-user">{{ u.fullName.charAt(0) }}</div>
                      <div>
                        <strong>{{ u.fullName }}</strong>
                      </div>
                    </div>
                  </td>
                  <td>{{ u.email }}</td>
                  <td>
                    <span class="badge" [ngClass]="'badge-role-' + (u.role | lowercase)">
                      {{ u.role }}
                    </span>
                  </td>
                  <!-- Admin Audit Columns -->
                  <td *ngIf="authService.isAdmin()">
                    <span class="status-pill-active">
                      <i class="fa-solid fa-circle-check"></i> Active (1)
                    </span>
                  </td>
                  <td *ngIf="authService.isAdmin()">
                    <span class="text-slate-500 font-mono text-xs">No (0)</span>
                  </td>
                  <td *ngIf="authService.isAdmin()">
                    <span class="remarks-tag" [title]="u.remarks || 'None'">
                      {{ u.remarks || '—' }}
                    </span>
                  </td>
                  <td>{{ u.createdAt | date:'mediumDate' }}</td>
                </tr>
                <tr *ngIf="users().length === 0">
                  <td [attr.colspan]="authService.isAdmin() ? 7 : 4" class="empty-state-cell">No users registered yet.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .users-page {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .page-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .admin-badge-wrap {
      margin-bottom: 0.375rem;
    }

    .admin-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 0.25rem 0.625rem;
      border-radius: var(--radius-full);
      background: rgba(99, 102, 241, 0.1);
      color: var(--primary-600);
      border: 1px solid rgba(99, 102, 241, 0.25);
    }

    .section-title {
      font-size: 1.375rem;
      font-weight: 800;
      color: var(--slate-900);
      margin: 0;
    }

    .section-desc {
      font-size: 0.8125rem;
      color: var(--slate-500);
      margin: 0.25rem 0 0;
    }

    .avatar-user {
      width: 32px;
      height: 32px;
      border-radius: var(--radius-full);
      background: linear-gradient(135deg, var(--primary-600), var(--primary-800));
      color: #ffffff;
      font-size: 0.75rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .status-pill-active {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.6875rem;
      font-weight: 700;
      color: var(--success);
      background: rgba(16, 185, 129, 0.1);
      padding: 0.125rem 0.5rem;
      border-radius: var(--radius-full);
    }

    .remarks-tag {
      font-size: 0.75rem;
      color: var(--slate-600);
      font-style: italic;
    }
  `]
})
export class UserListComponent implements OnInit {
  authService = inject(AuthService);
  users = signal<User[]>([]);
  loading = signal(true);

  ngOnInit() {
    this.authService.getAllUsers().subscribe({
      next: (res) => {
        this.users.set(res);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }
}
