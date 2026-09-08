import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NotificationService } from '../../core/services/notification.service';
import { ToastService } from '../../core/services/toast.service';
import { EmptyStateComponent } from '../../components/ui/empty-state.component';

@Component({
  selector: 'app-notifications-page',
  standalone: true,
  imports: [CommonModule, RouterModule, EmptyStateComponent],
  templateUrl: './notifications-page.component.html',
  styleUrl: './notifications-page.component.css'
})
export class NotificationsPageComponent implements OnInit {
  notificationService = inject(NotificationService);
  toast = inject(ToastService);

  ngOnInit() {
    this.notificationService.loadNotifications().subscribe();
  }

  markRead(id: number) {
    this.notificationService.markAsRead(id).subscribe();
  }

  markAllRead() {
    this.notificationService.markAllAsRead().subscribe({
      next: () => this.toast.success('All notifications marked as read.')
    });
  }
}
