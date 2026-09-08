import { Component, EventEmitter, Input, Output, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SubTask, TaskAttachment, TaskComment, TaskItem } from '../../core/models/task.model';
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
  @Output() taskUpdated = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();

  taskService = inject(TaskService);
  authService = inject(AuthService);
  toast = inject(ToastService);

  activeTab = signal<'overview' | 'subtasks' | 'attachments' | 'comments'>('overview');

  comments = signal<TaskComment[]>([]);
  newComment = '';
  replyToCommentId = signal<number | null>(null);
  replyContent = '';
  submittingComment = signal(false);

  subtasks = signal<SubTask[]>([]);
  newSubtaskTitle = '';

  attachments = signal<TaskAttachment[]>([]);
  isUploading = signal(false);

  ngOnInit() {
    this.loadComments();
    this.loadSubtasks();
    this.loadAttachments();
  }

  loadComments() {
    this.taskService.getComments(this.task.id).subscribe({
      next: (res) => this.comments.set(res)
    });
  }

  loadSubtasks() {
    if (this.task.subTasks) {
      this.subtasks.set(this.task.subTasks);
    }
  }

  loadAttachments() {
    this.taskService.getAttachments(this.task.id).subscribe({
      next: (res) => this.attachments.set(res)
    });
  }

  changeStatus(statusVal: number) {
    this.taskService.updateTaskStatus(this.task.id, statusVal).subscribe({
      next: (updated) => {
        this.task = updated;
        this.toast.success(`Status updated to ${updated.status}`);
        this.statusChanged.emit();
        this.taskUpdated.emit();
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Failed to update status.');
      }
    });
  }

  // Subtasks
  addSubtask() {
    if (!this.newSubtaskTitle.trim()) return;
    this.taskService.addSubTask(this.task.id, this.newSubtaskTitle.trim()).subscribe({
      next: (st) => {
        this.subtasks.update(list => [...list, st]);
        this.newSubtaskTitle = '';
        this.toast.success('Subtask added.');
        this.taskUpdated.emit();
      },
      error: () => this.toast.error('Failed to add subtask.')
    });
  }

  toggleSubtask(st: SubTask) {
    this.taskService.updateSubTask(this.task.id, st.id, st.title, !st.isCompleted, st.sortOrder).subscribe({
      next: (updated) => {
        this.subtasks.update(list => list.map(item => item.id === updated.id ? updated : item));
        this.taskUpdated.emit();
      },
      error: () => this.toast.error('Failed to toggle subtask.')
    });
  }

  deleteSubtask(stId: number) {
    this.taskService.deleteSubTask(this.task.id, stId).subscribe({
      next: () => {
        this.subtasks.update(list => list.filter(item => item.id !== stId));
        this.toast.success('Subtask deleted.');
        this.taskUpdated.emit();
      },
      error: () => this.toast.error('Failed to delete subtask.')
    });
  }

  // Attachments
  onFileSelected(event: any) {
    const file = event.target.files?.[0];
    if (!file) return;

    this.isUploading.set(true);
    this.taskService.uploadAttachment(this.task.id, file).subscribe({
      next: (att) => {
        this.attachments.update(list => [att, ...list]);
        this.isUploading.set(false);
        this.toast.success('File uploaded successfully.');
        this.taskUpdated.emit();
      },
      error: () => {
        this.isUploading.set(false);
        this.toast.error('Failed to upload file.');
      }
    });
  }

  deleteAttachment(attId: number) {
    this.taskService.deleteAttachment(attId).subscribe({
      next: () => {
        this.attachments.update(list => list.filter(item => item.id !== attId));
        this.toast.success('Attachment deleted.');
        this.taskUpdated.emit();
      },
      error: () => this.toast.error('Failed to delete attachment.')
    });
  }

  // Comments
  postComment(parentId?: number) {
    const content = parentId ? this.replyContent.trim() : this.newComment.trim();
    if (!content) return;

    this.submittingComment.set(true);
    this.taskService.addComment(this.task.id, content, parentId).subscribe({
      next: () => {
        this.loadComments();
        if (parentId) {
          this.replyContent = '';
          this.replyToCommentId.set(null);
        } else {
          this.newComment = '';
        }
        this.submittingComment.set(false);
        this.toast.success('Comment posted.');
      },
      error: (err) => {
        this.submittingComment.set(false);
        this.toast.error(err.error?.message || 'Failed to post comment.');
      }
    });
  }

  deleteComment(commentId: number) {
    this.taskService.deleteComment(commentId).subscribe({
      next: () => {
        this.loadComments();
        this.toast.success('Comment deleted.');
      },
      error: () => this.toast.error('Failed to delete comment.')
    });
  }

  isOverdue(dueDate?: string, status?: string): boolean {
    if (!dueDate || status === 'Done') return false;
    return new Date(dueDate) < new Date();
  }

  handleClose() {
    this.close.emit();
    this.closed.emit();
  }
}
