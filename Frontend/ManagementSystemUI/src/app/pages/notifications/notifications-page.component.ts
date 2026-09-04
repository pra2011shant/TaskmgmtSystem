import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NotificationService } from '../../core/services/notification.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-notifications-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="notifications-page">
      <div class="page-header">
        <div>
          <h2 class="section-title">Activity & Notifications</h2>
          <p class="section-desc">Real-time alerts on task assignments, status changes, and team discussions.</p>
        </div>

        <button 
          class="btn btn-secondary btn-sm" 
          (click)="markAllRead()"
          [disabled]="notificationService.unreadCount() === 0"
        >
          <i class="fa-solid fa-check-double"></i> Mark All as Read
        </button>
      </div>

      <div class="card notifs-container-card">
        <div class="card-body" style="padding: 0;">
          <div class="notif-feed-list">
            <div 
              *ngFor="let n of notificationService.notifications()" 
              class="full-notif-item" 
              [class.item-unread]="!n.isRead"
              (click)="markRead(n.id)"
            >
              <div class="notif-type-icon">
                <i *ngIf="n.type === 'TaskAssigned'" class="fa-solid fa-user-plus text-primary"></i>
                <i *ngIf="n.type === 'StatusUpdated'" class="fa-solid fa-arrows-rotate text-info"></i>
                <i *ngIf="n.type === 'CommentAdded'" class="fa-solid fa-comment-dots text-warning"></i>
              </div>

              <div class="notif-content-box">
                <div class="notif-title-row">
                  <h4>{{ n.title }}</h4>
                  <span class="notif-date">{{ n.createdAt | date:'medium' }}</span>
                </div>
                <p class="notif-msg">{{ n.message }}</p>
                <div class="notif-tags">
                  <span class="type-tag">{{ n.type }}</span>
                  <span *ngIf="!n.isRead" class="unread-pill">NEW</span>
                </div>
              </div>

              <div class="notif-action-col">
                <button 
                  *ngIf="!n.isRead" 
                  class="btn-icon" 
                  title="Mark as read"
                  (click)="$event.stopPropagation(); markRead(n.id)"
                >
                  <i class="fa-regular fa-circle-check"></i>
                </button>
              </div>
            </div>

            <div *ngIf="notificationService.notifications().length === 0" class="empty-notifs">
              <i class="fa-regular fa-bell-slash"></i>
              <h3>No Notifications Found</h3>
              <p>You're all caught up! New updates will appear here in real time.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .notifications-page {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
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

    .notif-feed-list {
      display: flex;
      flex-direction: column;
    }

    .full-notif-item {
      display: flex;
      align-items: flex-start;
      gap: 1.25rem;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid var(--slate-100);
      cursor: pointer;
      transition: background 0.15s;
    }

    .full-notif-item:hover {
      background: var(--slate-50);
    }

    .item-unread {
      background: #f5f7ff;
    }

    .notif-type-icon {
      width: 44px;
      height: 44px;
      border-radius: var(--radius-lg);
      background: #ffffff;
      border: 1px solid var(--slate-200);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.125rem;
      flex-shrink: 0;
      box-shadow: var(--shadow-sm);
    }

    .notif-content-box {
      flex: 1;
    }

    .notif-title-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.25rem;
    }

    .notif-title-row h4 {
      font-size: 0.9375rem;
      font-weight: 700;
      color: var(--slate-900);
      margin: 0;
    }

    .notif-date {
      font-size: 0.75rem;
      color: var(--slate-400);
    }

    .notif-msg {
      font-size: 0.875rem;
      color: var(--slate-700);
      margin: 0 0 0.5rem 0;
      line-height: 1.5;
    }

    .notif-tags {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }

    .type-tag {
      font-size: 0.6875rem;
      font-weight: 700;
      color: var(--primary-600);
      background: var(--primary-50);
      padding: 0.125rem 0.5rem;
      border-radius: var(--radius-sm);
    }

    .unread-pill {
      font-size: 0.625rem;
      font-weight: 800;
      color: #ffffff;
      background: var(--danger);
      padding: 0.125rem 0.375rem;
      border-radius: var(--radius-full);
    }

    .empty-notifs {
      padding: 4rem 2rem;
      text-align: center;
      color: var(--slate-400);
    }

    .empty-notifs i {
      font-size: 3rem;
      margin-bottom: 1rem;
      color: var(--slate-300);
    }
  `]
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
