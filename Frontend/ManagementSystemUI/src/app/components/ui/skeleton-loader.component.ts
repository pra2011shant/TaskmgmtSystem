import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skeleton-loader',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './skeleton-loader.component.html',
  styleUrl: './skeleton-loader.component.css'
})
export class SkeletonLoaderComponent {
  @Input() type: 'stats' | 'table' | 'kanban' | 'cards' = 'cards';
  @Input() count = 4;

  getArray(n: number): number[] {
    return Array.from({ length: n }, (_, i) => i);
  }
}
