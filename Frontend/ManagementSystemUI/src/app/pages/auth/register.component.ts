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
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
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
