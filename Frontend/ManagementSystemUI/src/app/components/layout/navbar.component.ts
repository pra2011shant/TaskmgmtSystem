import { Component, HostListener, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { ToastService } from '../../core/services/toast.service';
import { GlobalSearchModalComponent } from '../search/global-search-modal.component';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, GlobalSearchModalComponent],
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
  showSearchModal = signal<boolean>(false);

  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.showSearchModal.set(true);
    }
  }

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
      next: () => {
        this.isPersonaOpen.set(false);
        this.toast.success(`Active persona switched to ${roleName}!`);
        window.location.reload();
      },
      error: () => {
        this.toast.error(`Unable to switch to ${roleName}.`);
      }
    });
  }
}
