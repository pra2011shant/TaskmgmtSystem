import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container" *ngIf="toastService.toasts().length > 0">
      <div 
        *ngFor="let toast of toastService.toasts()" 
        class="toast toast-{{ toast.type }}"
      >
        <div class="toast-icon">
          <i *ngIf="toast.type === 'success'" class="fa-solid fa-circle-check text-success"></i>
          <i *ngIf="toast.type === 'error'" class="fa-solid fa-circle-exclamation text-danger"></i>
          <i *ngIf="toast.type === 'warning'" class="fa-solid fa-triangle-exclamation text-warning"></i>
          <i *ngIf="toast.type === 'info'" class="fa-solid fa-circle-info text-info"></i>
        </div>
        <div class="toast-body" style="flex: 1;">
          <h4 style="font-size: 0.875rem; font-weight: 700; margin-bottom: 0.125rem;">{{ toast.title }}</h4>
          <p style="font-size: 0.8125rem; color: var(--slate-600); margin: 0;">{{ toast.message }}</p>
        </div>
        <button class="btn-icon" style="padding: 0.25rem;" (click)="toastService.remove(toast.id)">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .text-success { color: var(--success); font-size: 1.125rem; }
    .text-danger { color: var(--danger); font-size: 1.125rem; }
    .text-warning { color: var(--warning); font-size: 1.125rem; }
    .text-info { color: var(--info); font-size: 1.125rem; }
  `]
})
export class ToastComponent {
  toastService = inject(ToastService);
}
