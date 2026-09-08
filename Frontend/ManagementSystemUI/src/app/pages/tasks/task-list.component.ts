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
import { BulkService } from '../../core/services/bulk.service';
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
  bulkService = inject(BulkService);
  toast = inject(ToastService);

  tasks = signal<TaskItem[]>([]);
  teams = signal<Team[]>([]);
  loading = signal(true);
  selectedTaskIds = signal<number[]>([]);

  viewMode = signal<'board' | 'table'>('board');
  
  // Filter variables
  search = '';
  statusFilter: number | null = null;
  priorityFilter: number | null = null;
  categoryFilter = '';
  teamFilter: number | null = null;
  isOverdueOnly = false;

  quickChip = signal<'all' | 'my' | 'urgent' | 'overdue'>('all');

  // Modals state
  showTaskModal = signal(false);
  selectedTaskForEdit = signal<TaskItem | null>(null);

  showDetailModal = signal(false);
  selectedTaskForDetail = signal<TaskItem | null>(null);

  // Drag-and-drop tracking
  draggedTask = signal<TaskItem | null>(null);

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
      category: this.categoryFilter || undefined,
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
      this.taskService.getTasks({ assignedToUserId: currentUserId }).subscribe({
        next: (res) => {
          this.tasks.set(res);
          this.loading.set(false);
        }
      });
      return;
    }
    if (chip === 'urgent') {
      this.priorityFilter = 4;
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
    this.search = '';
    this.statusFilter = null;
    this.priorityFilter = null;
    this.categoryFilter = '';
    this.teamFilter = null;
    this.isOverdueOnly = false;
    this.quickChip.set('all');
    this.loadTasks();
  }

  getTasksByStatus(status: 'ToDo' | 'InProgress' | 'Review' | 'Done'): TaskItem[] {
    return this.tasks().filter(t => {
      if (status === 'ToDo') return t.status === 'ToDo' || t.status === 'Created' || t.status === 'Assigned';
      return t.status === status;
    });
  }

  // Drag and Drop
  onDragStart(event: DragEvent, task: TaskItem) {
    this.draggedTask.set(task);
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', task.id.toString());
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }

  onDrop(event: DragEvent, targetStatusValue: number) {
    event.preventDefault();
    const task = this.draggedTask();
    if (!task) return;

    if (task.statusValue === targetStatusValue) {
      this.draggedTask.set(null);
      return;
    }

    this.taskService.updateTaskStatus(task.id, targetStatusValue).subscribe({
      next: () => {
        this.toast.success(`Task moved.`);
        this.draggedTask.set(null);
        this.loadTasks();
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Failed to update status.');
        this.draggedTask.set(null);
      }
    });
  }

  openCreateModal() {
    this.selectedTaskForEdit.set(null);
    this.showTaskModal.set(true);
  }

  openEditModal(task: TaskItem, event?: Event) {
    if (event) event.stopPropagation();
    this.selectedTaskForEdit.set(task);
    this.showTaskModal.set(true);
  }

  openDetailModal(task: TaskItem) {
    this.selectedTaskForDetail.set(task);
    this.showDetailModal.set(true);
  }

  deleteTask(task: TaskItem, event?: Event) {
    if (event) event.stopPropagation();
    if (confirm(`Are you sure you want to delete "${task.title}"?`)) {
      this.taskService.deleteTask(task.id).subscribe({
        next: () => {
          this.toast.success('Task deleted.');
          this.loadTasks();
        },
        error: (err) => this.toast.error(err.error?.message || 'Failed to delete task.')
      });
    }
  }

  isOverdue(dueDate?: string, status?: string): boolean {
    if (!dueDate || status === 'Done') return false;
    return new Date(dueDate) < new Date();
  }

  // Bulk Selection & Operations
  toggleSelectAll(event: any) {
    if (event.target.checked) {
      this.selectedTaskIds.set(this.tasks().map(t => t.id));
    } else {
      this.selectedTaskIds.set([]);
    }
  }

  toggleSelectTask(taskId: number, event: any) {
    event.stopPropagation();
    const current = this.selectedTaskIds();
    if (current.includes(taskId)) {
      this.selectedTaskIds.set(current.filter(id => id !== taskId));
    } else {
      this.selectedTaskIds.set([...current, taskId]);
    }
  }

  isTaskSelected(taskId: number): boolean {
    return this.selectedTaskIds().includes(taskId);
  }

  bulkUpdateStatus(newStatus: number) {
    const ids = this.selectedTaskIds();
    if (ids.length === 0) return;

    this.bulkService.bulkUpdateStatus(ids, newStatus).subscribe({
      next: (res) => {
        this.toast.success(res.message || 'Bulk status updated.');
        this.selectedTaskIds.set([]);
        this.loadTasks();
      },
      error: () => this.toast.error('Failed to update tasks in bulk.')
    });
  }

  bulkDelete() {
    const ids = this.selectedTaskIds();
    if (ids.length === 0) return;

    if (confirm(`Are you sure you want to delete ${ids.length} selected tasks?`)) {
      this.bulkService.bulkDelete(ids).subscribe({
        next: (res) => {
          this.toast.success(res.message || 'Tasks deleted.');
          this.selectedTaskIds.set([]);
          this.loadTasks();
        },
        error: () => this.toast.error('Failed to delete tasks.')
      });
    }
  }
}
