import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="auth-page-container">
      <div class="auth-card">
        <!-- Logo & Header -->
        <div class="auth-header">
          <div class="brand-badge">
            <i class="fa-solid fa-layer-group"></i>
          </div>
          <h2>Welcome to WorkFlow Pro</h2>
          <p>Sign in to manage your teams, tasks, and collaboration.</p>
        </div>

        <!-- Quick Demo Switcher -->
        <div class="demo-login-box">
          <span class="demo-title"><i class="fa-solid fa-bolt"></i> 1-Click Demo Login:</span>
          <div class="demo-buttons">
            <button type="button" class="demo-btn demo-admin" (click)="fillDemo('admin@system.com', 'Admin@123')">
              <i class="fa-solid fa-shield-halved"></i> Admin
            </button>
            <button type="button" class="demo-btn demo-manager" (click)="fillDemo('manager@system.com', 'Manager@123')">
              <i class="fa-solid fa-user-tie"></i> Manager
            </button>
            <button type="button" class="demo-btn demo-user" (click)="fillDemo('rahul@system.com', 'User@123')">
              <i class="fa-solid fa-user"></i> User
            </button>
          </div>
        </div>

        <!-- Login Form -->
        <form (ngSubmit)="onSubmit()" class="auth-form">
          <div class="form-group">
            <label class="form-label">Email Address</label>
            <div class="input-with-icon">
              <i class="fa-regular fa-envelope"></i>
              <input 
                type="email" 
                class="form-control" 
                [(ngModel)]="email" 
                name="email" 
                placeholder="name@company.com" 
                required
              />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Password</label>
            <div class="input-with-icon">
              <i class="fa-solid fa-lock"></i>
              <input 
                [type]="showPassword() ? 'text' : 'password'" 
                class="form-control" 
                [(ngModel)]="password" 
                name="password" 
                placeholder="••••••••" 
                required
              />
              <button type="button" class="password-toggle" (click)="showPassword.set(!showPassword())">
                <i [ngClass]="showPassword() ? 'fa-regular fa-eye-slash' : 'fa-regular fa-eye'"></i>
              </button>
            </div>
          </div>

          <button type="submit" class="btn btn-primary auth-submit-btn" [disabled]="loading()">
            <span *ngIf="!loading()"><i class="fa-solid fa-right-to-bracket"></i> Sign In</span>
            <span *ngIf="loading()"><i class="fa-solid fa-spinner fa-spin"></i> Authenticating...</span>
          </button>
        </form>

        <div class="auth-footer">
          <p class="admin-notice-text">
            <i class="fa-solid fa-user-shield"></i> User accounts are provisioned by System Administrators.
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-page-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: radial-gradient(circle at top right, #312e81, #0f172a 60%, #020617);
      padding: 1.5rem;
    }

    .auth-card {
      background: rgba(255, 255, 255, 0.98);
      border-radius: var(--radius-xl);
      padding: 2.5rem;
      width: 100%;
      max-width: 460px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.35);
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .auth-header {
      text-align: center;
      margin-bottom: 1.75rem;
    }

    .brand-badge {
      width: 52px;
      height: 52px;
      margin: 0 auto 1rem;
      border-radius: var(--radius-lg);
      background: linear-gradient(135deg, var(--primary-500), var(--primary-700));
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      box-shadow: var(--shadow-glow);
    }

    .auth-header h2 {
      font-size: 1.5rem;
      font-weight: 800;
      color: var(--slate-900);
      letter-spacing: -0.02em;
      margin-bottom: 0.375rem;
    }

    .auth-header p {
      font-size: 0.875rem;
      color: var(--slate-500);
    }

    .demo-login-box {
      background: var(--slate-50);
      border: 1px dashed var(--slate-300);
      border-radius: var(--radius-md);
      padding: 0.875rem;
      margin-bottom: 1.5rem;
    }

    .demo-title {
      display: block;
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--slate-600);
      margin-bottom: 0.5rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .demo-buttons {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.5rem;
    }

    .demo-btn {
      padding: 0.5rem 0.25rem;
      border-radius: var(--radius-sm);
      border: 1px solid var(--slate-200);
      background: #ffffff;
      font-size: 0.75rem;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.25rem;
      transition: all 0.15s ease;
    }

    .demo-admin { color: #7c3aed; }
    .demo-admin:hover { background: #f5f3ff; border-color: #c4b5fd; }

    .demo-manager { color: #0284c7; }
    .demo-manager:hover { background: #f0f9ff; border-color: #7dd3fc; }

    .demo-user { color: #059669; }
    .demo-user:hover { background: #ecfdf5; border-color: #6ee7b7; }

    .input-with-icon {
      position: relative;
      display: flex;
      align-items: center;
    }

    .input-with-icon > i {
      position: absolute;
      left: 0.875rem;
      color: var(--slate-400);
      font-size: 0.875rem;
    }

    .input-with-icon .form-control {
      padding-left: 2.375rem;
      padding-right: 2.375rem;
    }

    .password-toggle {
      position: absolute;
      right: 0.875rem;
      background: none;
      border: none;
      color: var(--slate-400);
      cursor: pointer;
    }

    .auth-submit-btn {
      width: 100%;
      padding: 0.75rem;
      font-size: 0.9375rem;
      margin-top: 0.5rem;
    }

    .auth-footer {
      text-align: center;
      margin-top: 1.5rem;
      font-size: 0.875rem;
      color: var(--slate-500);
    }

    .auth-footer a {
      color: var(--primary-600);
      font-weight: 700;
    }
  `]
})
export class LoginComponent {
  authService = inject(AuthService);
  toast = inject(ToastService);
  router = inject(Router);

  email = '';
  password = '';
  loading = signal(false);
  showPassword = signal(false);

  fillDemo(em: string, pass: string) {
    this.email = em;
    this.password = pass;
    this.onSubmit();
  }

  onSubmit() {
    if (!this.email || !this.password) {
      this.toast.warning('Please enter both email and password.');
      return;
    }

    this.loading.set(true);
    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.toast.success(`Welcome back, ${res.user.fullName}!`);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading.set(false);
        this.toast.error(err.error?.message || 'Invalid email or password.');
      }
    });
  }
}
