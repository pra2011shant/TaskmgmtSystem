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
  templateUrl: './task-modal.component.html',
  styleUrl: './task-modal.component.css'
})
export class TaskModalComponent implements OnInit {
  @Input() task: TaskItem | null = null;
  @Input() defaultDueDate: string | null = null;
  @Output() saved = new EventEmitter<TaskItem>();
  @Output() close = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  taskService = inject(TaskService);
  teamService = inject(TeamService);
  authService = inject(AuthService);
  toast = inject(ToastService);

  title = '';
  description = '';
  status = 2; // Default ToDo
  priority = 2; // Medium
  category = 'General';
  tags = '';
  estimatedHours: number | null = null;
  teamId: number | null = null;
  assignedToUserId: number | null = null;
  dueDate = '';
  remarks = '';

  initialSubtasksText = '';

  teams = signal<Team[]>([]);
  users = signal<User[]>([]);
  loading = signal(false);

  ngOnInit() {
    this.teamService.getTeams().subscribe(res => this.teams.set(res));
    this.authService.getAllUsers().subscribe(res => this.users.set(res));

    if (this.defaultDueDate) {
      this.dueDate = this.defaultDueDate.split('T')[0];
    }

    if (this.task) {
      this.title = this.task.title;
      this.description = this.task.description;
      this.category = this.task.category || 'General';
      this.tags = this.task.tags || '';
      this.estimatedHours = this.task.estimatedHours || null;
      this.status = this.task.statusValue || 2;
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

    const initialSubtasks = this.initialSubtasksText
      ? this.initialSubtasksText.split('\n').map(s => s.trim()).filter(s => s.length > 0)
      : undefined;

    const payload = {
      title: this.title.trim(),
      description: this.description.trim(),
      status: Number(this.status),
      priority: Number(this.priority),
      category: this.category.trim(),
      tags: this.tags.trim() || undefined,
      estimatedHours: this.estimatedHours ? Number(this.estimatedHours) : undefined,
      teamId: this.teamId ? Number(this.teamId) : null,
      assignedToUserId: this.assignedToUserId ? Number(this.assignedToUserId) : null,
      dueDate: this.dueDate ? new Date(this.dueDate).toISOString() : undefined,
      remarks: this.remarks ? this.remarks.trim() : undefined,
      initialSubtasks
    };

    if (this.task) {
      this.taskService.updateTask(this.task.id, payload).subscribe({
        next: (res) => {
          this.loading.set(false);
          this.toast.success('Task updated successfully.');
          this.saved.emit(res);
          this.close.emit();
        },
        error: (err) => {
          this.loading.set(false);
          this.toast.error(err.error?.message || 'Failed to update task.');
        }
      });
    } else {
      this.taskService.createTask(payload).subscribe({
        next: (res) => {
          this.loading.set(false);
          this.toast.success('Task created successfully.');
          this.saved.emit(res);
          this.close.emit();
        },
        error: (err) => {
          this.loading.set(false);
          this.toast.error(err.error?.message || 'Failed to create task.');
        }
      });
    }
  }

  handleClose() {
    this.close.emit();
    this.cancelled.emit();
  }
}
