import { Component, HostListener, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { ToastService } from '../../core/services/toast.service';
import { ThemeService } from '../../core/services/theme.service';
import { TimeTrackingService } from '../../core/services/time-tracking.service';
import { SignalRService } from '../../core/services/signalr.service';
import { GlobalSearchModalComponent } from '../search/global-search-modal.component';
import { TimeLog } from '../../core/models/time-tracking.model';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, GlobalSearchModalComponent],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnInit, OnDestroy {
  authService = inject(AuthService);
  notificationService = inject(NotificationService);
  themeService = inject(ThemeService);
  timeTrackingService = inject(TimeTrackingService);
  signalRService = inject(SignalRService);
  toast = inject(ToastService);
  router = inject(Router);

  isNotifOpen = signal<boolean>(false);
  isPersonaOpen = signal<boolean>(false);
  showSearchModal = signal<boolean>(false);
  activeTimer = signal<TimeLog | null>(null);
  timerElapsed = signal<string>('00:00:00');
  private timerInterval: any = null;

  ngOnInit(): void {
    this.signalRService.startConnection();
    this.checkActiveTimer();
    this.timerInterval = setInterval(() => {
      this.updateTicker();
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.timerInterval) clearInterval(this.timerInterval);
  }

  checkActiveTimer(): void {
    this.timeTrackingService.getActiveTimer().subscribe({
      next: (t) => this.activeTimer.set(t),
      error: () => {}
    });
  }

  updateTicker(): void {
    const timer = this.activeTimer();
    if (!timer || !timer.startTime) return;
    const start = new Date(timer.startTime).getTime();
    const now = new Date().getTime();
    const diffSec = Math.max(0, Math.floor((now - start) / 1000));
    const h = Math.floor(diffSec / 3600).toString().padStart(2, '0');
    const m = Math.floor((diffSec % 3600) / 60).toString().padStart(2, '0');
    const s = (diffSec % 60).toString().padStart(2, '0');
    this.timerElapsed.set(`${h}:${m}:${s}`);
  }

  stopActiveTimer(): void {
    const timer = this.activeTimer();
    if (!timer) return;
    this.timeTrackingService.stopTimer(timer.taskId).subscribe({
      next: () => {
        this.activeTimer.set(null);
        this.toast.success('Stopwatch stopped and logged to task.');
      },
      error: () => this.toast.error('Failed to stop timer')
    });
  }

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
