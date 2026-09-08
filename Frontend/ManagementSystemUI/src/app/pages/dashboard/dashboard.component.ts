import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TaskService } from '../../core/services/task.service';
import { AuthService } from '../../core/services/auth.service';
import { DashboardSummary } from '../../core/models/dashboard.model';
import { StatCardComponent } from '../../components/ui/stat-card.component';
import { StatusBadgeComponent } from '../../components/ui/status-badge.component';
import { SkeletonLoaderComponent } from '../../components/ui/skeleton-loader.component';
import { EmptyStateComponent } from '../../components/ui/empty-state.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    StatCardComponent, 
    StatusBadgeComponent, 
    SkeletonLoaderComponent, 
    EmptyStateComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  authService = inject(AuthService);
  taskService = inject(TaskService);

  summary = signal<DashboardSummary | null>(null);
  loading = signal(true);
  recentFilter = signal<'all' | 'ToDo' | 'InProgress' | 'Done'>('all');

  ngOnInit() {
    this.loadStats();
  }

  loadStats() {
    this.loading.set(true);
    this.taskService.getDashboardStats().subscribe({
      next: (res) => {
        this.summary.set(res);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  getTimeGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  }

  getRecentCount(status: string): number {
    const list = this.summary()?.recentTasks || [];
    return list.filter(t => t.status.toLowerCase() === status.toLowerCase()).length;
  }

  getFilteredRecentTasks() {
    const list = this.summary()?.recentTasks || [];
    const filter = this.recentFilter();
    if (filter === 'all') return list;
    return list.filter(t => t.status.toLowerCase() === filter.toLowerCase());
  }

  isOverdue(dueDate?: string, status?: string): boolean {
    if (!dueDate || status === 'Done' || status === 'Completed') return false;
    return new Date(dueDate) < new Date();
  }

  navigateToTasks() {
    window.location.href = '/tasks';
  }
}
