/**
 * In-App Notification & Alert State Service
 * 
 * Manages real-time alert dispatch, unread badges, and read-state synchronization
 * across the application shell using Angular Signals (`notifications`, `unreadCount`).
 */

import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { NotificationItem, NotificationResponse } from '../models/notification.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/notifications`;

  // Reactive State Signals for navbar badges and inbox components
  notifications = signal<NotificationItem[]>([]);
  unreadCount = signal<number>(0);

  /**
   * Loads recent notifications and updates unread badge count.
   */
  loadNotifications(): Observable<NotificationResponse> {
    return this.http.get<NotificationResponse>(this.apiUrl).pipe(
      tap(res => {
        this.notifications.set(res.notifications);
        this.unreadCount.set(res.unreadCount);
      })
    );
  }

  /**
   * Marks a single notification as read and decrements unread counter.
   */
  markAsRead(id: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/read`, {}).pipe(
      tap(() => {
        this.notifications.update(list =>
          list.map(n => n.id === id ? { ...n, isRead: true } : n)
        );
        this.unreadCount.update(c => Math.max(0, c - 1));
      })
    );
  }

  /**
   * Acknowledges all pending unread notifications and clears counter.
   */
  markAllAsRead(): Observable<any> {
    return this.http.patch(`${this.apiUrl}/read-all`, {}).pipe(
      tap(() => {
        this.notifications.update(list =>
          list.map(n => ({ ...n, isRead: true }))
        );
        this.unreadCount.set(0);
      })
    );
  }
}
