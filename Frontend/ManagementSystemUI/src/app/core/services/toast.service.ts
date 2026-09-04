/**
 * Toast Notification Dispatcher Service
 * 
 * Provides centralized in-app toast notification dispatches with automated timeouts
 * and reactive signal state (`toasts`).
 */

import { Injectable, signal } from '@angular/core';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  toasts = signal<ToastMessage[]>([]);

  /**
   * Dispatches a new toast notification with automated auto-dismiss timer.
   */
  show(type: 'success' | 'error' | 'warning' | 'info', message: string, title?: string, duration: number = 4000): void {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastMessage = { id, type, title, message, duration };
    
    this.toasts.update(current => [...current, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        this.remove(id);
      }, duration);
    }
  }

  /**
   * Dispatches a success alert toast.
   */
  success(message: string, title: string = 'Success'): void {
    this.show('success', message, title);
  }

  /**
   * Dispatches an error alert toast.
   */
  error(message: string, title: string = 'Error'): void {
    this.show('error', message, title, 5000);
  }

  /**
   * Dispatches a warning alert toast.
   */
  warning(message: string, title: string = 'Warning'): void {
    this.show('warning', message, title);
  }

  /**
   * Dispatches an informational alert toast.
   */
  info(message: string, title: string = 'Info'): void {
    this.show('info', message, title);
  }

  /**
   * Dismisses an active toast by ID.
   */
  remove(id: string): void {
    this.toasts.update(current => current.filter(t => t.id !== id));
  }
}
