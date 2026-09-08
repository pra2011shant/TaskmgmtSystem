import { Component, EventEmitter, Input, Output, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskComment, TaskItem } from '../../core/models/task.model';
import { TaskService } from '../../core/services/task.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { StatusBadgeComponent } from '../../components/ui/status-badge.component';

@Component({
  selector: 'app-task-detail-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, StatusBadgeComponent],
  templateUrl: './task-detail-modal.component.html',
  styleUrl: './task-detail-modal.component.css'
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
