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
      
      // Robust status parsing
      if (this.task.statusValue) {
        this.status = this.task.statusValue;
      } else if (typeof this.task.status === 'string') {
        const s = this.task.status.toLowerCase();
        this.status = s === 'done' ? 3 : s === 'inprogress' ? 2 : 1;
      } else {
        this.status = Number(this.task.status) || 1;
      }

      // Robust priority parsing
      if (this.task.priorityValue) {
        this.priority = this.task.priorityValue;
      } else if (typeof this.task.priority === 'string') {
        const p = this.task.priority.toLowerCase();
        this.priority = p === 'urgent' ? 4 : p === 'high' ? 3 : p === 'low' ? 1 : 2;
      } else {
        this.priority = Number(this.task.priority) || 2;
      }

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
