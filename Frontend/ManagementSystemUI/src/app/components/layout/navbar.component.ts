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
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
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
