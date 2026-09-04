import { Component, EventEmitter, Input, Output, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskItem } from '../../core/models/task.model';
import { Team } from '../../core/models/team.model';
import { User } from '../../core/models/auth.model';
import { TaskService } from '../../core/services/task.service';
import { TeamService } from '../../core/services/team.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-task-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-overlay" (click)="close()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <i class="fa-solid fa-pen-to-square text-primary"></i>
            <h3 style="margin: 0; font-size: 1.125rem; font-weight: 700;">
              {{ task ? 'Edit Task' : 'Create New Task' }}
            </h3>
          </div>
          <button class="btn-icon" (click)="close()"><i class="fa-solid fa-xmark"></i></button>
        </div>

        <form (ngSubmit)="saveTask()">
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">Task Title *</label>
              <input 
                type="text" 
                class="form-control" 
                [(ngModel)]="title" 
                name="title" 
                placeholder="e.g. Implement OAuth JWT Login" 
                required 
              />
            </div>

            <div class="form-group">
              <label class="form-label">Description</label>
              <textarea 
                class="form-control" 
                rows="3" 
                [(ngModel)]="description" 
                name="description" 
                placeholder="Details, requirements, acceptance criteria..."
              ></textarea>
            </div>

            <div class="form-row-2">
              <div class="form-group">
                <label class="form-label">Status</label>
                <select class="form-select" [(ngModel)]="status" name="status">
                  <option [ngValue]="1">To Do</option>
                  <option [ngValue]="2">In Progress</option>
                  <option [ngValue]="3">Done</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Priority</label>
                <select class="form-select" [(ngModel)]="priority" name="priority">
                  <option [ngValue]="1">Low</option>
                  <option [ngValue]="2">Medium</option>
                  <option [ngValue]="3">High</option>
                  <option [ngValue]="4">Urgent</option>
                </select>
              </div>
            </div>

            <div class="form-row-2">
              <div class="form-group">
                <label class="form-label">Assigned Team</label>
                <select class="form-select" [(ngModel)]="teamId" name="teamId">
                  <option [ngValue]="null">No Team / General</option>
                  <option *ngFor="let team of teams()" [ngValue]="team.id">{{ team.name }}</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Assignee</label>
                <select class="form-select" [(ngModel)]="assignedToUserId" name="assignedToUserId">
                  <option [ngValue]="null">Unassigned</option>
                  <option *ngFor="let u of users()" [ngValue]="u.id">{{ u.fullName }} ({{ u.role }})</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Due Date</label>
              <input 
                type="date" 
                class="form-control" 
                [(ngModel)]="dueDate" 
                name="dueDate" 
              />
            </div>

            <!-- Administrative Remarks (Admin Only) -->
            <div class="form-group" *ngIf="authService.isAdmin()">
              <label class="form-label">
                <i class="fa-solid fa-shield-halved text-primary"></i> Administrative Remarks (Admin Only)
              </label>
              <input 
                type="text" 
                class="form-control" 
                [(ngModel)]="remarks" 
                name="remarks" 
                placeholder="Optional audit tracking notes or remarks..." 
              />
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="close()">Cancel</button>
            <button type="submit" class="btn btn-primary" [disabled]="loading()">
              <i *ngIf="loading()" class="fa-solid fa-spinner fa-spin"></i>
              <span>{{ task ? 'Save Changes' : 'Create Task' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .form-row-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }
    @media (max-width: 540px) {
      .form-row-2 {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class TaskModalComponent implements OnInit {
  @Input() task: TaskItem | null = null;
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  taskService = inject(TaskService);
  teamService = inject(TeamService);
  authService = inject(AuthService);
  toast = inject(ToastService);

  title = '';
  description = '';
  status = 1;
  priority = 2;
  teamId: number | null = null;
  assignedToUserId: number | null = null;
  dueDate = '';
  remarks = '';

  teams = signal<Team[]>([]);
  users = signal<User[]>([]);
  loading = signal(false);

  ngOnInit() {
    this.teamService.getTeams().subscribe(res => this.teams.set(res));
    this.authService.getAllUsers().subscribe(res => this.users.set(res));

    if (this.task) {
      this.title = this.task.title;
      this.description = this.task.description;
      this.status = this.task.statusValue || 1;
      this.priority = this.task.priorityValue || 2;
      this.teamId = this.task.teamId || null;
      this.assignedToUserId = this.task.assignedToUserId || null;
      this.remarks = this.task.remarks || '';
      if (this.task.dueDate) {
        this.dueDate = this.task.dueDate.split('T')[0];
      }
    }
  }

  saveTask() {
    if (!this.title.trim()) {
      this.toast.warning('Please enter a task title.');
      return;
    }

    this.loading.set(true);
    const payload = {
      title: this.title,
      description: this.description,
      status: this.status,
      priority: this.priority,
      teamId: this.teamId,
      assignedToUserId: this.assignedToUserId,
      dueDate: this.dueDate ? new Date(this.dueDate).toISOString() : undefined,
      remarks: this.remarks ? this.remarks.trim() : undefined
    };

    if (this.task) {
      this.taskService.updateTask(this.task.id, payload).subscribe({
        next: () => {
          this.loading.set(false);
          this.toast.success('Task updated successfully.');
          this.saved.emit();
        },
        error: (err) => {
          this.loading.set(false);
          this.toast.error(err.error?.message || 'Failed to update task.');
        }
      });
    } else {
      this.taskService.createTask(payload).subscribe({
        next: () => {
          this.loading.set(false);
          this.toast.success('Task created successfully.');
          this.saved.emit();
        },
        error: (err) => {
          this.loading.set(false);
          this.toast.error(err.error?.message || 'Failed to create task.');
        }
      });
    }
  }

  close() {
    this.cancelled.emit();
  }
}
