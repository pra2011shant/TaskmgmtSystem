import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skeleton-loader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="skeleton-wrapper" [ngClass]="type">
      <ng-container [ngSwitch]="type">
        <!-- Stat Cards Skeleton -->
        <div *ngSwitchCase="'stats'" class="skeleton-stats-grid">
          <div *ngFor="let item of getArray(count || 4)" class="skeleton-card skeleton-stat-card">
            <div class="skeleton-row">
              <div class="skeleton-circle shimmer"></div>
              <div class="skeleton-pill shimmer"></div>
            </div>
            <div class="skeleton-line shimmer large"></div>
            <div class="skeleton-line shimmer small"></div>
          </div>
        </div>

        <!-- Table Skeleton -->
        <div *ngSwitchCase="'table'" class="skeleton-table">
          <div class="skeleton-table-header shimmer"></div>
          <div *ngFor="let item of getArray(count || 5)" class="skeleton-table-row">
            <div class="skeleton-line shimmer width-30"></div>
            <div class="skeleton-line shimmer width-20"></div>
            <div class="skeleton-line shimmer width-20"></div>
            <div class="skeleton-line shimmer width-15"></div>
          </div>
        </div>

        <!-- Kanban Skeleton -->
        <div *ngSwitchCase="'kanban'" class="skeleton-kanban-grid">
          <div *ngFor="let col of getArray(4)" class="skeleton-kanban-col">
            <div class="skeleton-line shimmer width-40"></div>
            <div *ngFor="let card of getArray(3)" class="skeleton-card shimmer kanban-card"></div>
          </div>
        </div>

        <!-- Generic Cards Skeleton -->
        <div *ngSwitchDefault class="skeleton-generic-grid">
          <div *ngFor="let item of getArray(count || 3)" class="skeleton-card">
            <div class="skeleton-line shimmer width-60"></div>
            <div class="skeleton-line shimmer width-80"></div>
            <div class="skeleton-line shimmer width-40"></div>
          </div>
        </div>
      </ng-container>
    </div>
  `,
  styles: [`
    .skeleton-wrapper {
      width: 100%;
      margin: 1rem 0;
    }

    .shimmer {
      background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 6px;
    }

    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    .skeleton-stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1.25rem;
    }

    .skeleton-card {
      background: #ffffff;
      border-radius: 16px;
      padding: 1.5rem;
      border: 1px solid #e2e8f0;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .skeleton-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .skeleton-circle {
      width: 44px;
      height: 44px;
      border-radius: 12px;
    }

    .skeleton-pill {
      width: 60px;
      height: 22px;
      border-radius: 9999px;
    }

    .skeleton-line {
      height: 14px;
      border-radius: 4px;
    }

    .skeleton-line.large {
      height: 28px;
      width: 50%;
    }

    .skeleton-line.small {
      height: 12px;
      width: 70%;
    }

    .width-15 { width: 15%; }
    .width-20 { width: 20%; }
    .width-30 { width: 30%; }
    .width-40 { width: 40%; }
    .width-60 { width: 60%; }
    .width-80 { width: 80%; }

    .skeleton-table {
      background: #ffffff;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .skeleton-table-header {
      height: 40px;
      width: 100%;
      border-radius: 8px;
    }

    .skeleton-table-row {
      display: flex;
      gap: 1rem;
      align-items: center;
      padding: 0.75rem 0;
      border-bottom: 1px solid #f1f5f9;
    }

    .skeleton-kanban-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.25rem;
    }

    .skeleton-kanban-col {
      background: #f8fafc;
      border-radius: 12px;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      min-height: 350px;
    }

    .kanban-card {
      height: 90px;
    }

    .skeleton-generic-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.25rem;
    }
  `]
})
export class SkeletonLoaderComponent {
  @Input() type: 'stats' | 'table' | 'kanban' | 'cards' = 'cards';
  @Input() count = 4;

  getArray(n: number): number[] {
    return Array.from({ length: n }, (_, i) => i);
  }
}
