import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskService } from '../../core/services/task.service';
import { TaskItem } from '../../core/models/task.model';
import { TaskDetailModalComponent } from '../tasks/task-detail-modal.component';
import { TaskModalComponent } from '../tasks/task-modal.component';

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  tasks: TaskItem[];
}

@Component({
  selector: 'app-calendar-view',
  standalone: true,
  imports: [CommonModule, TaskDetailModalComponent, TaskModalComponent],
  templateUrl: './calendar-view.component.html',
  styleUrl: './calendar-view.component.css'
})
export class CalendarViewComponent implements OnInit {
  private taskService = inject(TaskService);

  currentMonthDate = signal<Date>(new Date());
  calendarDays = signal<CalendarDay[]>([]);
  allTasks = signal<TaskItem[]>([]);
  isLoading = signal<boolean>(true);

  selectedTask = signal<TaskItem | null>(null);
  showTaskModal = signal<boolean>(false);
  taskToEdit = signal<TaskItem | null>(null);
  selectedDateForNewTask = signal<string | null>(null);

  weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  ngOnInit(): void {
    this.loadTasks();
  }

  loadTasks(): void {
    this.isLoading.set(true);
    this.taskService.getTasks().subscribe({
      next: (tasks) => {
        this.allTasks.set(tasks);
        this.generateCalendar();
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  generateCalendar(): void {
    const current = this.currentMonthDate();
    const year = current.getFullYear();
    const month = current.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const startingDayIndex = firstDayOfMonth.getDay();
    const totalDaysInMonth = lastDayOfMonth.getDate();

    const days: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Days from previous month
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayIndex - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthLastDay - i);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        tasks: this.getTasksForDate(date)
      });
    }

    // Days of current month
    for (let i = 1; i <= totalDaysInMonth; i++) {
      const date = new Date(year, month, i);
      const isToday = date.getTime() === today.getTime();
      days.push({
        date,
        isCurrentMonth: true,
        isToday,
        tasks: this.getTasksForDate(date)
      });
    }

    // Days for next month to complete 35 or 42 grid cells
    const remainingCells = 42 - days.length;
    for (let i = 1; i <= remainingCells; i++) {
      const date = new Date(year, month + 1, i);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        tasks: this.getTasksForDate(date)
      });
    }

    this.calendarDays.set(days);
  }

  getTasksForDate(date: Date): TaskItem[] {
    const dateStr = date.toISOString().split('T')[0];
    return this.allTasks().filter(t => {
      if (!t.dueDate) return false;
      const taskDue = new Date(t.dueDate).toISOString().split('T')[0];
      return taskDue === dateStr;
    });
  }

  prevMonth(): void {
    const current = this.currentMonthDate();
    this.currentMonthDate.set(new Date(current.getFullYear(), current.getMonth() - 1, 1));
    this.generateCalendar();
  }

  nextMonth(): void {
    const current = this.currentMonthDate();
    this.currentMonthDate.set(new Date(current.getFullYear(), current.getMonth() + 1, 1));
    this.generateCalendar();
  }

  goToToday(): void {
    this.currentMonthDate.set(new Date());
    this.generateCalendar();
  }

  openTaskDetail(task: TaskItem): void {
    this.selectedTask.set(task);
  }

  openCreateTaskOnDate(date: Date): void {
    this.selectedDateForNewTask.set(date.toISOString());
    this.taskToEdit.set(null);
    this.showTaskModal.set(true);
  }

  handleTaskSaved(task: TaskItem): void {
    this.showTaskModal.set(false);
    this.loadTasks();
  }
}
