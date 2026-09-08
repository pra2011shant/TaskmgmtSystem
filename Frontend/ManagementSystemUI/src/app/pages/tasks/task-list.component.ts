import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TaskItem, TaskFilter } from '../../core/models/task.model';
import { Team } from '../../core/models/team.model';
import { User } from '../../core/models/auth.model';
import { TaskService } from '../../core/services/task.service';
import { TeamService } from '../../core/services/team.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { TaskModalComponent } from './task-modal.component';
import { TaskDetailModalComponent } from './task-detail-modal.component';
import { StatusBadgeComponent } from '../../components/ui/status-badge.component';
import { SkeletonLoaderComponent } from '../../components/ui/skeleton-loader.component';
import { EmptyStateComponent } from '../../components/ui/empty-state.component';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    RouterModule, 
    TaskModalComponent, 
    TaskDetailModalComponent,
    StatusBadgeComponent,
    SkeletonLoaderComponent,
    EmptyStateComponent
  ],
  templateUrl: './task-list.component.html',
  styleUrl: './task-list.component.css'
})
export class TaskListComponent implements OnInit {
  taskService = inject(TaskService);
  teamService = inject(TeamService);
  authService = inject(AuthService);
  toast = inject(ToastService);

  tasks = signal<TaskItem[]>([]);
  teams = signal<Team[]>([]);
  loading = signal(true);

  viewMode = signal<'board' | 'table'>('board');
  
  // Filter variables
  search = '';
  statusFilter: number | null = null;
  priorityFilter: number | null = null;
  teamFilter: number | null = null;
  isOverdueOnly = false;

  quickChip = signal<'all' | 'my' | 'urgent' | 'overdue'>('all');

  // Modals state
  showTaskModal = signal(false);
  selectedTaskForEdit = signal<TaskItem | null>(null);

  showDetailModal = signal(false);
  selectedTaskForDetail = signal<TaskItem | null>(null);

  ngOnInit() {
    this.teamService.getTeams().subscribe(res => this.teams.set(res));
    this.loadTasks();
  }

  loadTasks() {
    this.loading.set(true);
    const filter: TaskFilter = {
      search: this.search || undefined,
      status: this.statusFilter !== null ? this.statusFilter : undefined,
      priority: this.priorityFilter !== null ? this.priorityFilter : undefined,
      teamId: this.teamFilter !== null ? this.teamFilter : undefined,
      isOverdue: this.isOverdueOnly ? true : undefined
    };

    this.taskService.getTasks(filter).subscribe({
      next: (res) => {
        this.tasks.set(res);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  applyFilters() {
    this.loadTasks();
  }

  applyQuickChip(chip: 'all' | 'my' | 'urgent' | 'overdue') {
    this.quickChip.set(chip);
    if (chip === 'all') {
      this.resetFilters();
      return;
    }
    if (chip === 'my') {
      const currentUserId = this.authService.currentUser()?.id;
      this.loading.set(true);
      this.taskService.getTasks().subscribe({
        next: (res) => {
          this.tasks.set(res.filter(t => t.assignedToUserId === currentUserId));
          this.loading.set(false);
        },
        error: () => this.loading.set(false)
      });
      return;
    }
    if (chip === 'urgent') {
      this.priorityFilter = 4;
      this.isOverdueOnly = false;
      this.loadTasks();
      return;
    }
    if (chip === 'overdue') {
      this.isOverdueOnly = true;
      this.loadTasks();
      return;
    }
  }

  resetFilters() {
    this.quickChip.set('all');
    this.search = '';
    this.statusFilter = null;
    this.priorityFilter = null;
    this.teamFilter = null;
    this.isOverdueOnly = false;
    this.loadTasks();
  }

  isOverdue(dueDate?: string, status?: string): boolean {
    if (!dueDate || status === 'Done') return false;
    return new Date(dueDate) < new Date();
  }

  getTasksByStatus(status: 'ToDo' | 'InProgress' | 'Done'): TaskItem[] {
    return this.tasks().filter(t => t.status === status);
  }

  moveStatus(task: TaskItem, newStatusVal: number) {
    this.taskService.updateTaskStatus(task.id, newStatusVal).subscribe({
      next: () => {
        this.toast.success(`Task moved!`);
        this.loadTasks();
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Failed to update status.');
      }
    });
  }

  openCreateModal() {
    this.selectedTaskForEdit.set(null);
    this.showTaskModal.set(true);
  }

  openEditModal(task: TaskItem) {
    this.selectedTaskForEdit.set(task);
    this.showTaskModal.set(true);
  }

  openDetailModal(task: TaskItem) {
    this.selectedTaskForDetail.set(task);
    this.showDetailModal.set(true);
  }

  onTaskSaved() {
    this.showTaskModal.set(false);
    this.loadTasks();
  }

  deleteTask(id: number) {
    if (confirm('Are you sure you want to delete this task?')) {
      this.taskService.deleteTask(id).subscribe({
        next: () => {
          this.toast.success('Task deleted.');
          this.loadTasks();
        },
        error: (err) => {
          this.toast.error(err.error?.message || 'Failed to delete task.');
        }
      });
    }
  }
}
