import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="badge" [ngClass]="[computedClass, sizeClass]">
      <i *ngIf="showIcon && computedIcon" [class]="computedIcon"></i>
      <span>{{ label || text }}</span>
    </span>
  `,
  styles: [`
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.25rem 0.65rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 700;
      line-height: 1;
      letter-spacing: 0.025em;
      white-space: nowrap;
      transition: all 0.2s ease;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
    }

    .badge-sm {
      padding: 0.175rem 0.5rem;
      font-size: 0.7rem;
    }

    .badge-lg {
      padding: 0.375rem 0.85rem;
      font-size: 0.8125rem;
    }

    /* Statuses */
    .status-todo {
      background: rgba(148, 163, 184, 0.15);
      color: #475569;
      border: 1px solid rgba(148, 163, 184, 0.3);
    }

    .status-inprogress {
      background: rgba(59, 130, 246, 0.12);
      color: #2563eb;
      border: 1px solid rgba(59, 130, 246, 0.3);
    }

    .status-inreview {
      background: rgba(245, 158, 11, 0.12);
      color: #d97706;
      border: 1px solid rgba(245, 158, 11, 0.3);
    }

    .status-completed {
      background: rgba(16, 185, 129, 0.12);
      color: #059669;
      border: 1px solid rgba(16, 185, 129, 0.3);
    }

    .status-cancelled {
      background: rgba(239, 68, 68, 0.12);
      color: #dc2626;
      border: 1px solid rgba(239, 68, 68, 0.3);
    }

    /* Priorities */
    .priority-low {
      background: rgba(100, 116, 139, 0.12);
      color: #475569;
      border: 1px solid rgba(100, 116, 139, 0.25);
    }

    .priority-medium {
      background: rgba(2, 132, 199, 0.12);
      color: #0284c7;
      border: 1px solid rgba(2, 132, 199, 0.25);
    }

    .priority-high {
      background: rgba(234, 88, 12, 0.12);
      color: #ea580c;
      border: 1px solid rgba(234, 88, 12, 0.25);
    }

    .priority-critical {
      background: rgba(225, 29, 72, 0.14);
      color: #e11d48;
      border: 1px solid rgba(225, 29, 72, 0.3);
      box-shadow: 0 0 10px rgba(225, 29, 72, 0.2);
    }

    /* Roles */
    .role-admin {
      background: rgba(99, 102, 241, 0.14);
      color: #4f46e5;
      border: 1px solid rgba(99, 102, 241, 0.3);
    }

    .role-manager {
      background: rgba(14, 165, 233, 0.14);
      color: #0284c7;
      border: 1px solid rgba(14, 165, 233, 0.3);
    }

    .role-user {
      background: rgba(16, 185, 129, 0.14);
      color: #059669;
      border: 1px solid rgba(16, 185, 129, 0.3);
    }

    .badge-overdue {
      background: rgba(239, 68, 68, 0.14);
      color: #dc2626;
      border: 1px solid rgba(239, 68, 68, 0.35);
      animation: pulse-border 2s infinite ease-in-out;
    }

    @keyframes pulse-border {
      0%, 100% { border-color: rgba(239, 68, 68, 0.35); }
      50% { border-color: rgba(239, 68, 68, 0.8); }
    }
  `]
})
export class StatusBadgeComponent {
  @Input() type: 'status' | 'priority' | 'role' | 'custom' = 'status';
  @Input() value: any;
  @Input() text?: string;
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() showIcon = true;

  get sizeClass(): string {
    return this.size === 'sm' ? 'badge-sm' : this.size === 'lg' ? 'badge-lg' : '';
  }

  get computedClass(): string {
    const val = typeof this.value === 'string' ? this.value.toLowerCase().replace(/\s+/g, '') : this.value;

    if (this.type === 'priority') {
      if (val === 4 || val === 'critical') return 'priority-critical';
      if (val === 3 || val === 'high') return 'priority-high';
      if (val === 2 || val === 'medium') return 'priority-medium';
      return 'priority-low';
    }

    if (this.type === 'role') {
      if (val === 1 || val === 'admin') return 'role-admin';
      if (val === 2 || val === 'manager') return 'role-manager';
      return 'role-user';
    }

    // Default status
    if (val === 4 || val === 'completed' || val === 'done') return 'status-completed';
    if (val === 3 || val === 'inreview' || val === 'review') return 'status-inreview';
    if (val === 2 || val === 'inprogress') return 'status-inprogress';
    if (val === 5 || val === 'cancelled') return 'status-cancelled';
    return 'status-todo';
  }

  get computedIcon(): string {
    const val = typeof this.value === 'string' ? this.value.toLowerCase().replace(/\s+/g, '') : this.value;

    if (this.type === 'priority') {
      if (val === 4 || val === 'critical') return 'fa-solid fa-triangle-exclamation';
      if (val === 3 || val === 'high') return 'fa-solid fa-angles-up';
      if (val === 2 || val === 'medium') return 'fa-solid fa-angle-up';
      return 'fa-solid fa-minus';
    }

    if (this.type === 'role') {
      if (val === 1 || val === 'admin') return 'fa-solid fa-shield-halved';
      if (val === 2 || val === 'manager') return 'fa-solid fa-user-tie';
      return 'fa-solid fa-user';
    }

    if (val === 4 || val === 'completed' || val === 'done') return 'fa-solid fa-circle-check';
    if (val === 3 || val === 'inreview' || val === 'review') return 'fa-solid fa-circle-pause';
    if (val === 2 || val === 'inprogress') return 'fa-solid fa-spinner fa-spin-pulse';
    if (val === 5 || val === 'cancelled') return 'fa-solid fa-ban';
    return 'fa-regular fa-circle-dot';
  }

  get label(): string {
    if (this.text) return this.text;
    const val = this.value;

    if (this.type === 'priority') {
      if (val === 4 || val === '4') return 'Critical';
      if (val === 3 || val === '3') return 'High';
      if (val === 2 || val === '2') return 'Medium';
      if (val === 1 || val === '1') return 'Low';
    }

    if (this.type === 'role') {
      if (val === 1 || val === '1') return 'Admin';
      if (val === 2 || val === '2') return 'Manager';
      if (val === 3 || val === '3') return 'User';
    }

    if (this.type === 'status') {
      if (val === 1 || val === '1') return 'To Do';
      if (val === 2 || val === '2') return 'In Progress';
      if (val === 3 || val === '3') return 'In Review';
      if (val === 4 || val === '4') return 'Completed';
      if (val === 5 || val === '5') return 'Cancelled';
    }

    return String(val ?? '');
  }
}
