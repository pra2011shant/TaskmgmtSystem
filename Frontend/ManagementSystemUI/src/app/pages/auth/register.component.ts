import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

/**
 * User Registration Component
 * 
 * Provides an administrative user provisioning interface (accessible via Admin menu)
 * or standalone registration. When invoked by an authenticated administrator,
 * it preserves the active admin session and redirects to the User Directory upon success.
 */
@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div [ngClass]="isAdminMode() ? 'admin-register-wrapper' : 'auth-page-container'">
      <div class="auth-card" [class.admin-card-layout]="isAdminMode()">
        <!-- Header -->
        <div class="auth-header">
          <div class="brand-badge">
            <i class="fa-solid fa-user-plus"></i>
          </div>
          <h2>{{ isAdminMode() ? 'Register New System User' : 'Create Account' }}</h2>
          <p>{{ isAdminMode() ? 'Provision an employee account and assign role privileges.' : 'Join WorkFlow Pro and collaborate seamlessly.' }}</p>
        </div>

        <form (ngSubmit)="onSubmit()" class="auth-form">
          <div class="form-group">
            <label class="form-label">Full Name *</label>
            <input 
              type="text" 
              class="form-control" 
              [(ngModel)]="fullName" 
              name="fullName" 
              placeholder="e.g. John Doe" 
              required
            />
          </div>

          <div class="form-group">
            <label class="form-label">Email Address *</label>
            <input 
              type="email" 
              class="form-control" 
              [(ngModel)]="email" 
              name="email" 
              placeholder="name@company.com" 
              required
            />
          </div>

          <div class="form-group">
            <label class="form-label">System Role *</label>
            <select class="form-select" [(ngModel)]="role" name="role">
              <option [ngValue]="3">Team Member (User)</option>
              <option [ngValue]="2">Manager</option>
              <option [ngValue]="1">Administrator</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Password *</label>
            <div class="input-with-icon">
              <i class="fa-solid fa-lock"></i>
              <input 
                [type]="showPassword() ? 'text' : 'password'" 
                class="form-control" 
                [(ngModel)]="password" 
                name="password" 
                placeholder="Min 6 chars with 1 special char (e.g. Pass@123)" 
                required
              />
              <button 
                type="button" 
                class="password-toggle" 
                (click)="showPassword.set(!showPassword())"
                [title]="showPassword() ? 'Hide Password' : 'Show Password'"
              >
                <i [ngClass]="showPassword() ? 'fa-regular fa-eye-slash' : 'fa-regular fa-eye'"></i>
              </button>
            </div>
            <!-- Password validation indicators -->
            <div class="password-requirements">
              <div class="req-item" [class.valid]="isLengthValid">
                <i class="fa-solid" [ngClass]="isLengthValid ? 'fa-circle-check' : 'fa-circle-xmark'"></i>
                <span>Minimum 6 characters</span>
              </div>
              <div class="req-item" [class.valid]="hasSpecialChar">
                <i class="fa-solid" [ngClass]="hasSpecialChar ? 'fa-circle-check' : 'fa-circle-xmark'"></i>
                <span>At least 1 special character (&#64;, #, $, %, !, &amp;, *)</span>
              </div>
            </div>
          </div>

          <!-- Optional Remarks (Visible in Admin Mode) -->
          <div class="form-group" *ngIf="isAdminMode()">
            <label class="form-label">
              <i class="fa-solid fa-shield-halved text-primary"></i> Administrative Remarks
            </label>
            <input 
              type="text" 
              class="form-control" 
              [(ngModel)]="remarks" 
              name="remarks" 
              placeholder="Department, employee ID, or onboarding notes..."
            />
          </div>

          <div class="form-actions">
            <a *ngIf="isAdminMode()" routerLink="/users" class="btn btn-secondary">
              <i class="fa-solid fa-arrow-left"></i> Cancel
            </a>
            <button type="submit" class="btn btn-primary auth-submit-btn" [disabled]="loading()">
              <span *ngIf="!loading()"><i class="fa-solid fa-user-check"></i> {{ isAdminMode() ? 'Provision Account' : 'Register Account' }}</span>
              <span *ngIf="loading()"><i class="fa-solid fa-spinner fa-spin"></i> Creating account...</span>
            </button>
          </div>
        </form>

        <div class="auth-footer" *ngIf="!isAdminMode()">
          <p>Already have an account? <a routerLink="/login">Sign in</a></p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-register-wrapper {
      max-width: 620px;
      margin: 0 auto;
      padding: 1rem 0;
    }

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
      max-width: 480px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.35);
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .admin-card-layout {
      max-width: 600px;
      box-shadow: var(--shadow-md);
      border: 1px solid var(--slate-200);
      background: #ffffff;
    }

    .auth-header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .brand-badge {
      width: 48px;
      height: 48px;
      border-radius: var(--radius-xl);
      background: linear-gradient(135deg, var(--primary-600), var(--primary-800));
      color: #ffffff;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      margin-bottom: 1rem;
      box-shadow: 0 8px 16px rgba(79, 70, 229, 0.3);
    }

    .auth-header h2 {
      font-size: 1.5rem;
      font-weight: 800;
      color: var(--slate-900);
      letter-spacing: -0.02em;
      margin: 0;
    }

    .auth-header p {
      font-size: 0.875rem;
      color: var(--slate-500);
      margin: 0.5rem 0 0;
    }

    .auth-form {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .input-with-icon {
      position: relative;
      display: flex;
      align-items: center;
    }

    .input-with-icon i:first-child {
      position: absolute;
      left: 1rem;
      color: var(--slate-400);
      pointer-events: none;
    }

    .input-with-icon .form-control {
      padding-left: 2.75rem;
      padding-right: 2.75rem;
    }

    .password-toggle {
      position: absolute;
      right: 0.75rem;
      background: transparent;
      border: none;
      color: var(--slate-400);
      cursor: pointer;
      padding: 0.25rem 0.5rem;
      font-size: 0.875rem;
      transition: color 0.15s;
    }

    .password-toggle:hover {
      color: var(--slate-700);
    }

    .password-requirements {
      margin-top: 0.5rem;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .req-item {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.75rem;
      color: var(--slate-400);
    }

    .req-item.valid {
      color: var(--success);
    }

    .form-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-top: 0.5rem;
    }

    .auth-submit-btn {
      flex: 1;
      padding: 0.75rem 1rem;
      font-size: 0.9375rem;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }

    .auth-footer {
      text-align: center;
      margin-top: 1.5rem;
      padding-top: 1.25rem;
      border-top: 1px solid var(--slate-200);
    }

    .auth-footer p {
      font-size: 0.8125rem;
      color: var(--slate-500);
      margin: 0;
    }

    .auth-footer a {
      color: var(--primary-600);
      font-weight: 600;
    }
  `]
})
export class RegisterComponent {
  authService = inject(AuthService);
  toast = inject(ToastService);
  router = inject(Router);

  fullName = '';
  email = '';
  password = '';
  role = 3;
  remarks = '';
  loading = signal(false);
  showPassword = signal(false);

  isAdminMode = computed(() => this.authService.isAuthenticated() && this.authService.isAdmin());

  get isLengthValid(): boolean {
    return this.password.length >= 6;
  }

  get hasSpecialChar(): boolean {
    return /[^a-zA-Z0-9]/.test(this.password);
  }

  onSubmit(): void {
    if (!this.fullName || !this.email || !this.password) {
      this.toast.warning('Please fill in all required fields.');
      return;
    }

    if (!this.isLengthValid) {
      this.toast.error('Password must be at least 6 characters long.');
      return;
    }

    if (!this.hasSpecialChar) {
      this.toast.error('Password must contain at least one special character (e.g. @, #, $, %, !, &, *).');
      return;
    }

    this.loading.set(true);

    const payload = {
      fullName: this.fullName.trim(),
      email: this.email.trim(),
      password: this.password,
      role: this.role,
      remarks: this.remarks ? this.remarks.trim() : undefined
    };

    if (this.isAdminMode()) {
      // Use admin registration that preserves active admin session
      this.authService.adminRegisterUser(payload).subscribe({
        next: (res) => {
          this.loading.set(false);
          this.toast.success(`Account created successfully for ${res.user.fullName} (${res.user.role})!`);
          this.router.navigate(['/users']);
        },
        error: (err) => {
          this.loading.set(false);
          this.toast.error(err.error?.message || 'Failed to register account. Check server status.');
        }
      });
    } else {
      // Standalone registration
      this.authService.register(payload).subscribe({
        next: (res) => {
          this.loading.set(false);
          this.toast.success(`Account created successfully! Welcome ${res.user.fullName}`);
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          this.loading.set(false);
          this.toast.error(err.error?.message || 'Registration failed. Try again.');
        }
      });
    }
  }
}
