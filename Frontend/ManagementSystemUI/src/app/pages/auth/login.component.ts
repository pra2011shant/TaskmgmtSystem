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
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  authService = inject(AuthService);
  toast = inject(ToastService);
  router = inject(Router);

  email = '';
  password = '';
  loading = signal(false);
  showPassword = signal(false);

  // Forgot / Reset Password flow states
  showForgotModal = signal(false);
  forgotStep = signal<1 | 2>(1); // 1 = Enter Email, 2 = Enter Code & New Password
  forgotEmail = '';
  forgotCode = '';
  newPassword = '';
  confirmPassword = '';
  forgotLoading = signal(false);

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

  openForgotModal() {
    this.forgotEmail = this.email || '';
    this.forgotCode = '';
    this.newPassword = '';
    this.confirmPassword = '';
    this.forgotStep.set(1);
    this.showForgotModal.set(true);
  }

  closeForgotModal() {
    this.showForgotModal.set(false);
  }

  onRequestResetCode() {
    if (!this.forgotEmail) {
      this.toast.warning('Please enter your email address.');
      return;
    }

    this.forgotLoading.set(true);
    this.authService.forgotPassword(this.forgotEmail).subscribe({
      next: (res) => {
        this.forgotLoading.set(false);
        if (res.resetCode) {
          this.forgotCode = res.resetCode;
        }
        this.toast.success(res.message || 'Recovery code generated.');
        this.forgotStep.set(2);
      },
      error: (err) => {
        this.forgotLoading.set(false);
        this.toast.error(err.error?.message || 'Failed to process password recovery request.');
      }
    });
  }

  onResetPassword() {
    if (!this.forgotCode || !this.newPassword) {
      this.toast.warning('Please enter the reset code and your new password.');
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.toast.warning('Passwords do not match. Please verify.');
      return;
    }

    this.forgotLoading.set(true);
    this.authService.resetPassword({
      email: this.forgotEmail,
      resetCode: this.forgotCode,
      newPassword: this.newPassword
    }).subscribe({
      next: (res) => {
        this.forgotLoading.set(false);
        this.toast.success(res.message || 'Password reset successfully! Please sign in.');
        this.email = this.forgotEmail;
        this.password = this.newPassword;
        this.closeForgotModal();
      },
      error: (err) => {
        this.forgotLoading.set(false);
        this.toast.error(err.error?.message || 'Failed to reset password.');
      }
    });
  }
}
