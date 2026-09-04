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

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TaskModalComponent, TaskDetailModalComponent],
  template: `
    <div class="tasks-page">
      <!-- Header Actions & Controls -->
      <div class="tasks-page-header">
        <div>
          <h2 class="section-title">Tasks & Kanban Board</h2>
          <p class="section-desc">Manage, filter, and track status across all workflows.</p>
        </div>

        <div class="header-actions">
          <!-- Calendar Schedule View Link -->
          <a routerLink="/schedule" class="btn btn-secondary">
            <i class="fa-regular fa-calendar-days"></i> Timeline Schedule
          </a>

          <!-- View Toggle Switch -->
          <div class="view-switch">
            <button 
              type="button" 
              class="switch-btn" 
              [class.active]="viewMode() === 'board'"
              (click)="viewMode.set('board')"
            >
              <i class="fa-solid fa-table-columns"></i> Kanban
            </button>
            <button 
              type="button" 
              class="switch-btn" 
              [class.active]="viewMode() === 'table'"
              (click)="viewMode.set('table')"
            >
              <i class="fa-solid fa-table-list"></i> Table
            </button>
          </div>

          <!-- Create Task Button (Admin / Manager) -->
          <button 
            *ngIf="authService.isManager()" 
            class="btn btn-primary" 
            (click)="openCreateModal()"
          >
            <i class="fa-solid fa-plus"></i> Create Task
          </button>
        </div>
      </div>

      <!-- Filter Bar -->
      <div class="card filter-bar-card">
        <div class="filter-grid">
          <!-- Search input -->
          <div class="filter-col search-col">
            <div class="input-with-icon">
              <i class="fa-solid fa-magnifying-glass"></i>
              <input 
                type="text" 
                class="form-control" 
                [(ngModel)]="search" 
                (ngModelChange)="applyFilters()" 
                placeholder="Search by title or description..."
              />
            </div>
          </div>

          <!-- Status Filter -->
          <div class="filter-col">
            <select class="form-select" [(ngModel)]="statusFilter" (ngModelChange)="applyFilters()">
              <option [ngValue]="null">All Statuses</option>
              <option [ngValue]="1">To Do</option>
              <option [ngValue]="2">In Progress</option>
              <option [ngValue]="3">Done</option>
            </select>
          </div>

          <!-- Priority Filter -->
          <div class="filter-col">
            <select class="form-select" [(ngModel)]="priorityFilter" (ngModelChange)="applyFilters()">
              <option [ngValue]="null">All Priorities</option>
              <option [ngValue]="1">Low</option>
              <option [ngValue]="2">Medium</option>
              <option [ngValue]="3">High</option>
              <option [ngValue]="4">Urgent</option>
            </select>
          </div>

          <!-- Team Filter -->
          <div class="filter-col">
            <select class="form-select" [(ngModel)]="teamFilter" (ngModelChange)="applyFilters()">
              <option [ngValue]="null">All Teams</option>
              <option *ngFor="let tm of teams()" [ngValue]="tm.id">{{ tm.name }}</option>
            </select>
          </div>

          <!-- Overdue Only Toggle -->
          <div class="filter-col-check">
            <label class="check-label">
              <input type="checkbox" [(ngModel)]="isOverdueOnly" (ngModelChange)="applyFilters()">
              <span>Overdue Only</span>
            </label>
          </div>

          <!-- Reset Filter -->
          <div class="filter-col-reset">
            <button class="btn btn-secondary btn-sm" (click)="resetFilters()" title="Reset Filters">
              <i class="fa-solid fa-arrow-rotate-left"></i> Reset
            </button>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading()" class="loading-state">
        <i class="fa-solid fa-spinner fa-spin"></i>
        <span>Loading tasks...</span>
      </div>

      <!-- 1. KANBAN BOARD VIEW -->
      <div *ngIf="!loading() && viewMode() === 'board'" class="kanban-board-container">
        <!-- To Do Column -->
        <div class="kanban-column column-todo">
          <div class="column-header">
            <div class="col-title-wrap">
              <span class="col-dot dot-todo"></span>
              <h4>To Do</h4>
            </div>
            <span class="col-count">{{ getTasksByStatus('ToDo').length }}</span>
          </div>

          <div class="kanban-cards-wrapper">
            <div 
              *ngFor="let t of getTasksByStatus('ToDo')" 
              class="kanban-card" 
              (click)="openDetailModal(t)"
            >
              <div class="card-top">
                <span class="badge" [ngClass]="'badge-' + (t.priority | lowercase)">{{ t.priority }}</span>
                <span *ngIf="t.teamName" class="card-team-pill">{{ t.teamName }}</span>
              </div>
              <h4 class="card-task-title">{{ t.title }}</h4>
              <p class="card-desc">{{ t.description }}</p>
              <div class="card-bottom">
                <div class="card-assignee">
                  <div class="avatar-tiny">{{ (t.assignedToUserName || '?').charAt(0) }}</div>
                  <span>{{ t.assignedToUserName || 'Unassigned' }}</span>
                </div>
                <div class="card-meta-right">
                  <span *ngIf="t.commentsCount > 0" class="comment-count-tag">
                    <i class="fa-regular fa-comment"></i> {{ t.commentsCount }}
                  </span>
                  <div class="status-shift-btns" (click)="$event.stopPropagation()">
                    <button class="shift-btn" title="Move to In Progress" (click)="moveStatus(t, 2)">
                      <i class="fa-solid fa-arrow-right"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div *ngIf="getTasksByStatus('ToDo').length === 0" class="empty-col">
              No tasks in To Do
            </div>
          </div>
        </div>

        <!-- In Progress Column -->
        <div class="kanban-column column-inprogress">
          <div class="column-header">
            <div class="col-title-wrap">
              <span class="col-dot dot-inprogress"></span>
              <h4>In Progress</h4>
            </div>
            <span class="col-count">{{ getTasksByStatus('InProgress').length }}</span>
          </div>

          <div class="kanban-cards-wrapper">
            <div 
              *ngFor="let t of getTasksByStatus('InProgress')" 
              class="kanban-card" 
              (click)="openDetailModal(t)"
            >
              <div class="card-top">
                <span class="badge" [ngClass]="'badge-' + (t.priority | lowercase)">{{ t.priority }}</span>
                <span *ngIf="t.teamName" class="card-team-pill">{{ t.teamName }}</span>
              </div>
              <h4 class="card-task-title">{{ t.title }}</h4>
              <p class="card-desc">{{ t.description }}</p>
              <div class="card-bottom">
                <div class="card-assignee">
                  <div class="avatar-tiny">{{ (t.assignedToUserName || '?').charAt(0) }}</div>
                  <span>{{ t.assignedToUserName || 'Unassigned' }}</span>
                </div>
                <div class="card-meta-right">
                  <span *ngIf="t.commentsCount > 0" class="comment-count-tag">
                    <i class="fa-regular fa-comment"></i> {{ t.commentsCount }}
                  </span>
                  <div class="status-shift-btns" (click)="$event.stopPropagation()">
                    <button class="shift-btn" title="Move to To Do" (click)="moveStatus(t, 1)">
                      <i class="fa-solid fa-arrow-left"></i>
                    </button>
                    <button class="shift-btn" title="Move to Done" (click)="moveStatus(t, 3)">
                      <i class="fa-solid fa-arrow-right"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div *ngIf="getTasksByStatus('InProgress').length === 0" class="empty-col">
              No tasks In Progress
            </div>
          </div>
        </div>

        <!-- Done Column -->
        <div class="kanban-column column-done">
          <div class="column-header">
            <div class="col-title-wrap">
              <span class="col-dot dot-done"></span>
              <h4>Completed</h4>
            </div>
            <span class="col-count">{{ getTasksByStatus('Done').length }}</span>
          </div>

          <div class="kanban-cards-wrapper">
            <div 
              *ngFor="let t of getTasksByStatus('Done')" 
              class="kanban-card card-completed" 
              (click)="openDetailModal(t)"
            >
              <div class="card-top">
                <span class="badge badge-done">Done</span>
                <span *ngIf="t.teamName" class="card-team-pill">{{ t.teamName }}</span>
              </div>
              <h4 class="card-task-title task-strike">{{ t.title }}</h4>
              <p class="card-desc">{{ t.description }}</p>
              <div class="card-bottom">
                <div class="card-assignee">
                  <div class="avatar-tiny">{{ (t.assignedToUserName || '?').charAt(0) }}</div>
                  <span>{{ t.assignedToUserName || 'Unassigned' }}</span>
                </div>
                <div class="card-meta-right">
                  <div class="status-shift-btns" (click)="$event.stopPropagation()">
                    <button class="shift-btn" title="Move back to In Progress" (click)="moveStatus(t, 2)">
                      <i class="fa-solid fa-arrow-left"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div *ngIf="getTasksByStatus('Done').length === 0" class="empty-col">
              No completed tasks
            </div>
          </div>
        </div>
      </div>

      <!-- 2. TABLE VIEW -->
      <div *ngIf="!loading() && viewMode() === 'table'" class="card">
        <div class="card-body" style="padding: 0;">
          <div class="table-responsive">
            <table class="custom-table">
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Team</th>
                  <th>Assignee</th>
                  <th>Due Date</th>
                  <!-- Administrator Audit Columns (Admin Only) -->
                  <th *ngIf="authService.isAdmin()">Created Date</th>
                  <th *ngIf="authService.isAdmin()">Remarks</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let t of tasks()">
                  <td>
                    <div class="table-task-cell" (click)="openDetailModal(t)" style="cursor: pointer;">
                      <strong class="hover-primary">{{ t.title }}</strong>
                      <small class="text-slate-500">{{ t.description | slice:0:60 }}{{ t.description.length > 60 ? '...' : '' }}</small>
                    </div>
                  </td>
                  <td>
                    <span class="badge" [ngClass]="'badge-' + (t.status | lowercase)">{{ t.status }}</span>
                  </td>
                  <td>
                    <span class="badge" [ngClass]="'badge-' + (t.priority | lowercase)">{{ t.priority }}</span>
                  </td>
                  <td>{{ t.teamName || 'General' }}</td>
                  <td>
                    <div style="display: flex; align-items: center; gap: 0.375rem;">
                      <div class="avatar-tiny">{{ (t.assignedToUserName || '?').charAt(0) }}</div>
                      <span>{{ t.assignedToUserName || 'Unassigned' }}</span>
                    </div>
                  </td>
                  <td>
                    <span [class.text-danger]="isOverdue(t.dueDate, t.status)">
                      {{ t.dueDate ? (t.dueDate | date:'mediumDate') : 'No date' }}
                    </span>
                  </td>
                  <!-- Admin Only Audit Columns -->
                  <td *ngIf="authService.isAdmin()">
                    <span class="text-slate-500 font-mono text-xs">{{ (t.createdDate || t.createdAt) | date:'shortDate' }}</span>
                  </td>
                  <td *ngIf="authService.isAdmin()">
                    <span class="remarks-tag" [title]="t.remarks || 'None'">{{ t.remarks || '—' }}</span>
                  </td>
                  <td>
                    <div class="table-action-btns">
                      <button class="btn-icon" (click)="openDetailModal(t)" title="Comments & Details">
                        <i class="fa-solid fa-comments"></i>
                      </button>
                      <button 
                        *ngIf="authService.isManager()" 
                        class="btn-icon" 
                        (click)="openEditModal(t)" 
                        title="Edit Task"
                      >
                        <i class="fa-solid fa-pen-to-square"></i>
                      </button>
                      <button 
                        *ngIf="authService.isManager()" 
                        class="btn-icon text-danger" 
                        (click)="deleteTask(t.id)" 
                        title="Delete Task"
                      >
                        <i class="fa-solid fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
                <tr *ngIf="tasks().length === 0">
                  <td [attr.colspan]="authService.isAdmin() ? 9 : 7" class="empty-state-cell">No tasks match your search or filter.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Create / Edit Modal -->
      <app-task-modal
        *ngIf="showTaskModal()"
        [task]="selectedTaskForEdit()"
        (saved)="onTaskSaved()"
        (cancelled)="showTaskModal.set(false)"
      ></app-task-modal>

      <!-- Task Details & Comments Modal -->
      <app-task-detail-modal
        *ngIf="showDetailModal() && selectedTaskForDetail()"
        [task]="selectedTaskForDetail()!"
        (statusChanged)="loadTasks()"
        (closed)="showDetailModal.set(false)"
      ></app-task-detail-modal>
    </div>
  `,
  styles: [`
    .tasks-page {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .tasks-page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
    }

    .section-title {
      font-size: 1.375rem;
      font-weight: 800;
      color: var(--slate-900);
      margin: 0;
    }

    .section-desc {
      font-size: 0.8125rem;
      color: var(--slate-500);
      margin: 0.25rem 0 0;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .view-switch {
      display: flex;
      background: var(--slate-200);
      padding: 0.25rem;
      border-radius: var(--radius-md);
      gap: 0.25rem;
    }

    .switch-btn {
      padding: 0.375rem 0.75rem;
      border-radius: var(--radius-sm);
      border: none;
      background: transparent;
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--slate-600);
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.375rem;
      transition: all 0.15s;
    }

    .switch-btn.active {
      background: #ffffff;
      color: var(--slate-900);
      box-shadow: var(--shadow-sm);
    }

    .filter-bar-card {
      padding: 1rem 1.25rem;
    }

    .filter-grid {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1fr auto auto;
      gap: 0.75rem;
      align-items: center;
    }

    @media (max-width: 1024px) {
      .filter-grid {
        grid-template-columns: 1fr 1fr;
      }
      .search-col {
        grid-column: span 2;
      }
    }

    .check-label {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--slate-700);
      cursor: pointer;
      white-space: nowrap;
    }

    /* KANBAN BOARD STYLES */
    .kanban-board-container {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.25rem;
      align-items: flex-start;
    }

    @media (max-width: 900px) {
      .kanban-board-container {
        grid-template-columns: 1fr;
      }
    }

    .kanban-column {
      background: var(--slate-100);
      border-radius: var(--radius-xl);
      border: 1px solid var(--slate-200);
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.875rem;
      min-height: 500px;
    }

    .column-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid var(--slate-200);
    }

    .col-title-wrap {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .col-title-wrap h4 {
      font-size: 0.9375rem;
      font-weight: 700;
      color: var(--slate-800);
      margin: 0;
    }

    .col-dot {
      width: 10px;
      height: 10px;
      border-radius: var(--radius-full);
    }

    .dot-todo { background: #64748b; }
    .dot-inprogress { background: #3b82f6; }
    .dot-done { background: #10b981; }

    .col-count {
      background: #ffffff;
      border: 1px solid var(--slate-300);
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--slate-700);
      padding: 0.125rem 0.5rem;
      border-radius: var(--radius-full);
    }

    .kanban-cards-wrapper {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .kanban-card {
      background: #ffffff;
      border-radius: var(--radius-lg);
      border: 1px solid var(--slate-200);
      padding: 1rem;
      box-shadow: var(--shadow-sm);
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .kanban-card:hover {
      box-shadow: var(--shadow-md);
      transform: translateY(-2px);
      border-color: var(--primary-300);
    }

    .card-completed {
      background: #fafcfb;
      opacity: 0.9;
    }

    .card-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .card-team-pill {
      font-size: 0.6875rem;
      font-weight: 600;
      color: var(--primary-600);
      background: var(--primary-50);
      padding: 0.125rem 0.375rem;
      border-radius: var(--radius-sm);
    }

    .card-task-title {
      font-size: 0.875rem;
      font-weight: 700;
      color: var(--slate-900);
      margin: 0;
      line-height: 1.3;
    }

    .task-strike {
      text-decoration: line-through;
      color: var(--slate-500);
    }

    .card-desc {
      font-size: 0.75rem;
      color: var(--slate-600);
      margin: 0;
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .card-bottom {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-top: 1px solid var(--slate-100);
      padding-top: 0.625rem;
      margin-top: 0.25rem;
    }

    .card-assignee {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--slate-600);
    }

    .avatar-tiny {
      width: 22px;
      height: 22px;
      border-radius: var(--radius-full);
      background: linear-gradient(135deg, var(--primary-600), var(--primary-800));
      color: #ffffff;
      font-size: 0.625rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .card-meta-right {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .comment-count-tag {
      font-size: 0.6875rem;
      color: var(--slate-500);
      font-weight: 600;
    }

    .status-shift-btns {
      display: flex;
      gap: 0.25rem;
    }

    .shift-btn {
      width: 24px;
      height: 24px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--slate-300);
      background: var(--slate-50);
      color: var(--slate-700);
      font-size: 0.6875rem;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.15s;
    }

    .shift-btn:hover {
      background: var(--primary-600);
      color: #ffffff;
      border-color: var(--primary-600);
    }

    .empty-col {
      text-align: center;
      padding: 2.5rem 1rem;
      color: var(--slate-400);
      font-size: 0.8125rem;
      border: 2px dashed var(--slate-200);
      border-radius: var(--radius-lg);
    }

    .table-task-cell {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
    }

    .hover-primary:hover {
      color: var(--primary-600);
    }

    .table-action-btns {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }
  `]
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

  resetFilters() {
    this.search = '';
    this.statusFilter = null;
    this.priorityFilter = null;
    this.teamFilter = null;
    this.isOverdueOnly = false;
    this.loadTasks();
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

  isOverdue(dueDate?: string, status?: string): boolean {
    if (!dueDate || status === 'Done') return false;
    return new Date(dueDate) < new Date();
  }
}
