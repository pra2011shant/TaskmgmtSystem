import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './status-badge.component.html',
  styleUrl: './status-badge.component.css'
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
