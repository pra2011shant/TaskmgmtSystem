import { Component, EventEmitter, Input, Output, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskComment, TaskItem } from '../../core/models/task.model';
import { TaskService } from '../../core/services/task.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-task-detail-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-overlay" (click)="close()">
      <div class="modal-content modal-large" (click)="$event.stopPropagation()">
        <!-- Header -->
        <div class="modal-header">
          <div class="task-title-group">
            <span class="badge" [ngClass]="'badge-' + (task.status | lowercase)">{{ task.status }}</span>
            <h3 class="task-modal-title">{{ task.title }}</h3>
          </div>
          <button class="btn-icon" (click)="close()"><i class="fa-solid fa-xmark"></i></button>
        </div>

        <div class="modal-body">
          <!-- Quick Status Buttons (For all roles) -->
          <div class="quick-status-bar">
            <span class="status-bar-label">Quick Update Status:</span>
            <div class="status-btn-group">
              <button 
                type="button" 
                class="btn-status" 
                [class.active]="task.status === 'ToDo'"
                (click)="changeStatus(1)"
              >
                <i class="fa-solid fa-circle-dot"></i> To Do
              </button>
              <button 
                type="button" 
                class="btn-status" 
                [class.active]="task.status === 'InProgress'"
                (click)="changeStatus(2)"
              >
                <i class="fa-solid fa-spinner"></i> In Progress
              </button>
              <button 
                type="button" 
                class="btn-status" 
                [class.active]="task.status === 'Done'"
                (click)="changeStatus(3)"
              >
                <i class="fa-solid fa-circle-check"></i> Done
              </button>
            </div>
          </div>

          <!-- Description -->
          <div class="detail-section">
            <label class="section-label">Description</label>
            <p class="description-text">{{ task.description || 'No description provided.' }}</p>
          </div>

          <!-- Metadata Grid -->
          <div class="meta-grid">
            <div class="meta-card">
              <span class="meta-label">Priority</span>
              <span class="badge" [ngClass]="'badge-' + (task.priority | lowercase)">
                {{ task.priority }}
              </span>
            </div>

            <div class="meta-card">
              <span class="meta-label">Assignee</span>
              <div class="assignee-val">
                <div class="avatar-xs">{{ (task.assignedToUserName || '?').charAt(0) }}</div>
                <span>{{ task.assignedToUserName || 'Unassigned' }}</span>
              </div>
            </div>

            <div class="meta-card">
              <span class="meta-label">Team</span>
              <span class="meta-val">{{ task.teamName || 'General' }}</span>
            </div>

            <div class="meta-card">
              <span class="meta-label">Due Date</span>
              <span class="meta-val" [class.text-danger]="isOverdue(task.dueDate, task.status)">
                {{ task.dueDate ? (task.dueDate | date:'mediumDate') : 'No deadline' }}
              </span>
            </div>
          </div>

          <!-- System Audit & Tracking Columns (ADMIN ONLY) -->
          <div class="admin-audit-box" *ngIf="authService.isAdmin()">
            <div class="audit-box-header">
              <div class="audit-header-left">
                <i class="fa-solid fa-shield-halved text-primary"></i>
                <span class="audit-box-title">System Audit & Tracking (Admin Only)</span>
              </div>
              <span class="audit-restricted-pill">Privileged View</span>
            </div>
            <div class="audit-fields-grid">
              <div class="audit-field">
                <span class="audit-label">Remarks:</span>
                <span class="audit-val">{{ task.remarks || 'None' }}</span>
              </div>
              <div class="audit-field">
                <span class="audit-label">Workflow Status:</span>
                <span class="audit-val">{{ task.status }}</span>
              </div>
              <div class="audit-field">
                <span class="audit-label">Soft Delete (IsDeleted):</span>
                <span class="audit-val">{{ task.isDeleted ? '1 (Deleted)' : '0 (Active)' }}</span>
              </div>
              <div class="audit-field">
                <span class="audit-label">Created Date (UTC):</span>
                <span class="audit-val">{{ (task.createdDate || task.createdAt) | date:'medium' }}</span>
              </div>
              <div class="audit-field">
                <span class="audit-label">Last Updated Date:</span>
                <span class="audit-val">{{ task.lastUpdatedDate ? (task.lastUpdatedDate | date:'medium') : 'Not modified' }}</span>
              </div>
              <div class="audit-field">
                <span class="audit-label">Created By ID:</span>
                <span class="audit-val">{{ task.createdByUserName || ('User #' + (task.createdById || 1)) }}</span>
              </div>
            </div>
          </div>

          <!-- Comments / Discussion Collaboration Thread -->
          <div class="comments-section">
            <div class="comments-header">
              <div style="display: flex; align-items: center; gap: 0.5rem;">
                <i class="fa-solid fa-comments text-primary"></i>
                <h4 style="margin: 0; font-size: 0.9375rem; font-weight: 700;">Collaboration & Comments ({{ comments().length }})</h4>
              </div>
            </div>

            <!-- Comment List -->
            <div class="comment-list">
              <div *ngFor="let c of comments()" class="comment-item">
                <div class="comment-avatar">
                  {{ c.userName.charAt(0) }}
                </div>
                <div class="comment-bubble">
                  <div class="comment-bubble-header">
                    <span class="comment-author">{{ c.userName }}</span>
                    <span class="badge badge-role" [ngClass]="'badge-role-' + (c.userRole | lowercase)">{{ c.userRole }}</span>
                    <span class="comment-time">{{ c.createdAt | date:'short' }}</span>
                  </div>
                  <p class="comment-content">{{ c.content }}</p>
                </div>
              </div>

              <div *ngIf="comments().length === 0" class="no-comments">
                <p>No comments yet. Start the conversation!</p>
              </div>
            </div>

            <!-- Add Comment Box -->
            <form (ngSubmit)="postComment()" class="add-comment-form">
              <div class="comment-input-wrap">
                <input 
                  type="text" 
                  class="form-control" 
                  [(ngModel)]="newComment" 
                  name="newComment" 
                  placeholder="Write a comment or update on this task..."
                  required
                />
                <button type="submit" class="btn btn-primary btn-sm" [disabled]="submittingComment() || !newComment.trim()">
                  <i class="fa-solid fa-paper-plane"></i>
                  <span>Send</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" (click)="close()">Close</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-large {
      max-width: 680px;
    }

    .task-title-group {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .task-modal-title {
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--slate-900);
      margin: 0;
    }

    .quick-status-bar {
      background: var(--slate-50);
      padding: 0.875rem 1rem;
      border-radius: var(--radius-lg);
      border: 1px solid var(--slate-200);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 1.25rem;
    }

    .status-bar-label {
      font-size: 0.8125rem;
      font-weight: 700;
      color: var(--slate-600);
    }

    .status-btn-group {
      display: flex;
      gap: 0.5rem;
    }

    .btn-status {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.375rem 0.75rem;
      border-radius: var(--radius-md);
      border: 1px solid var(--slate-300);
      background: #ffffff;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--slate-700);
      cursor: pointer;
      transition: all 0.15s;
    }

    .btn-status.active {
      background: var(--primary-600);
      color: #ffffff;
      border-color: var(--primary-600);
      box-shadow: 0 2px 6px rgba(79, 70, 229, 0.3);
    }

    .detail-section {
      margin-bottom: 1.25rem;
    }

    .section-label {
      display: block;
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--slate-500);
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin-bottom: 0.375rem;
    }

    .description-text {
      font-size: 0.875rem;
      color: var(--slate-700);
      line-height: 1.6;
      background: var(--slate-50);
      padding: 0.875rem 1rem;
      border-radius: var(--radius-md);
      border: 1px solid var(--slate-100);
    }

    .meta-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 0.75rem;
      margin-bottom: 1.5rem;
    }

    @media (max-width: 640px) {
      .meta-grid {
        grid-template-columns: repeat(2, 1fr);
      }
      .quick-status-bar {
        flex-direction: column;
        align-items: flex-start;
      }
    }

    .meta-card {
      background: var(--slate-50);
      border: 1px solid var(--slate-200);
      border-radius: var(--radius-md);
      padding: 0.75rem;
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
    }

    .meta-label {
      font-size: 0.6875rem;
      font-weight: 700;
      color: var(--slate-500);
      text-transform: uppercase;
    }

    .meta-val {
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--slate-800);
    }

    .assignee-val {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.8125rem;
      font-weight: 600;
    }

    .admin-audit-box {
      margin-bottom: 1.5rem;
      background: #f8fafc;
      border: 1px dashed #cbd5e1;
      border-radius: var(--radius-lg);
      padding: 1rem 1.25rem;
    }

    .audit-box-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.75rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid #e2e8f0;
    }

    .audit-header-left {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .audit-box-title {
      font-size: 0.8125rem;
      font-weight: 700;
      color: var(--slate-800);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .audit-restricted-pill {
      font-size: 0.625rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 0.125rem 0.5rem;
      border-radius: 9999px;
      background: var(--primary-100);
      color: var(--primary-700);
    }

    .audit-fields-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.625rem 1rem;
    }

    .audit-field {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
    }

    .audit-label {
      font-size: 0.6875rem;
      font-weight: 600;
      color: var(--slate-500);
    }

    .audit-val {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--slate-800);
    }

    .avatar-xs {
      width: 22px;
      height: 22px;
      border-radius: var(--radius-full);
      background: var(--primary-600);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.6875rem;
      font-weight: 700;
    }

    .comments-section {
      border-top: 1px solid var(--slate-200);
      padding-top: 1.25rem;
    }

    .comment-list {
      display: flex;
      flex-direction: column;
      gap: 0.875rem;
      max-height: 220px;
      overflow-y: auto;
      margin: 1rem 0;
      padding-right: 0.5rem;
    }

    .comment-item {
      display: flex;
      gap: 0.75rem;
    }

    .comment-avatar {
      width: 32px;
      height: 32px;
      border-radius: var(--radius-full);
      background: linear-gradient(135deg, var(--slate-700), var(--slate-900));
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: 700;
      flex-shrink: 0;
    }

    .comment-bubble {
      flex: 1;
      background: var(--slate-50);
      border: 1px solid var(--slate-200);
      border-radius: var(--radius-lg);
      padding: 0.75rem 1rem;
    }

    .comment-bubble-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.25rem;
    }

    .comment-author {
      font-size: 0.8125rem;
      font-weight: 700;
      color: var(--slate-900);
    }

    .comment-time {
      font-size: 0.6875rem;
      color: var(--slate-400);
      margin-left: auto;
    }

    .comment-content {
      font-size: 0.8125rem;
      color: var(--slate-700);
      margin: 0;
      line-height: 1.4;
    }

    .no-comments {
      text-align: center;
      padding: 1rem;
      color: var(--slate-400);
      font-size: 0.8125rem;
    }

    .comment-input-wrap {
      display: flex;
      gap: 0.5rem;
    }
  `]
})
export class TaskDetailModalComponent implements OnInit {
  @Input() task!: TaskItem;
  @Output() statusChanged = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();

  taskService = inject(TaskService);
  authService = inject(AuthService);
  toast = inject(ToastService);

  comments = signal<TaskComment[]>([]);
  newComment = '';
  submittingComment = signal(false);

  ngOnInit() {
    this.loadComments();
  }

  loadComments() {
    this.taskService.getComments(this.task.id).subscribe({
      next: (res) => this.comments.set(res)
    });
  }

  changeStatus(statusVal: number) {
    this.taskService.updateTaskStatus(this.task.id, statusVal).subscribe({
      next: (updated) => {
        this.task = updated;
        this.toast.success(`Status updated to ${updated.status}`);
        this.statusChanged.emit();
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Failed to update status.');
      }
    });
  }

  postComment() {
    if (!this.newComment.trim()) return;

    this.submittingComment.set(true);
    this.taskService.addComment(this.task.id, this.newComment.trim()).subscribe({
      next: (c) => {
        this.comments.update(list => [...list, c]);
        this.newComment = '';
        this.submittingComment.set(false);
        this.toast.success('Comment added.');
      },
      error: (err) => {
        this.submittingComment.set(false);
        this.toast.error(err.error?.message || 'Failed to add comment.');
      }
    });
  }

  isOverdue(dueDate?: string, status?: string): boolean {
    if (!dueDate || status === 'Done') return false;
    return new Date(dueDate) < new Date();
  }

  close() {
    this.closed.emit();
  }
}
