import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stat-card.component.html',
  styleUrl: './stat-card.component.css'
})
export class StatCardComponent {
  @Input() label = '';
  @Input() value: string | number = 0;
  @Input() icon = 'fa-solid fa-chart-simple';
  @Input() iconClass = 'icon-indigo';
  @Input() badgeText?: string;
  @Input() badgeClass = 'badge-primary';
  @Input() trendText?: string;
  @Input() trendPositive = true;
  @Input() subText?: string;
  @Input() variant = '';
}
