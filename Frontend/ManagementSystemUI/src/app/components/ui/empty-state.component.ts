import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="empty-state-wrapper">
      <div class="icon-circle">
        <i [class]="icon"></i>
      </div>
      <h3 class="empty-title">{{ title }}</h3>
      <p class="empty-description">{{ description }}</p>
      <div *ngIf="actionLabel" class="empty-action">
        <button class="btn btn-primary" (click)="actionClicked.emit()">
          <i *ngIf="actionIcon" [class]="actionIcon"></i>
          {{ actionLabel }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .empty-state-wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 3.5rem 1.5rem;
      background: var(--card-bg, #ffffff);
      border-radius: var(--radius-lg, 16px);
      border: 2px dashed var(--border-color, #e2e8f0);
      margin: 1.5rem 0;
      animation: fadeIn 0.3s ease-in-out;
    }

    .icon-circle {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.1));
      color: #6366f1;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2rem;
      margin-bottom: 1.25rem;
      border: 1px solid rgba(99, 102, 241, 0.2);
    }

    .empty-title {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--text-main, #0f172a);
      margin-bottom: 0.5rem;
    }

    .empty-description {
      font-size: 0.925rem;
      color: var(--text-muted, #64748b);
      max-width: 420px;
      line-height: 1.5;
      margin-bottom: 1.5rem;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.65rem 1.25rem;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.875rem;
      cursor: pointer;
      border: none;
      transition: all 0.2s ease;
    }

    .btn-primary {
      background: #4f46e5;
      color: white;
      box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25);
    }

    .btn-primary:hover {
      background: #4338ca;
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(79, 70, 229, 0.35);
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: scale(0.98); }
      to { opacity: 1; transform: scale(1); }
    }
  `]
})
export class EmptyStateComponent {
  @Input() icon = 'fa-solid fa-folder-open';
  @Input() title = 'No items found';
  @Input() description = 'There are no records matching your current filter criteria.';
  @Input() actionLabel?: string;
  @Input() actionIcon?: string;
  @Output() actionClicked = new EventEmitter<void>();
}
