import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskItem } from '../../core/models/task.model';
import { Team } from '../../core/models/team.model';
import { TaskService } from '../../core/services/task.service';
import { TeamService } from '../../core/services/team.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { TaskDetailModalComponent } from '../tasks/task-detail-modal.component';
import { StatusBadgeComponent } from '../../components/ui/status-badge.component';
import { SkeletonLoaderComponent } from '../../components/ui/skeleton-loader.component';

interface DayAssigneeSummary {
  userId: number;
  userName: string;
  email: string;
  count: number;
}

interface CalendarDay {
  date: Date;
  dateString: string;
  dayName: string;
  dayNumber: number;
  isToday: boolean;
  isSelected: boolean;
  taskCount: number;
}

@Component({
  selector: 'app-task-schedule',
  standalone: true,
  imports: [CommonModule, FormsModule, TaskDetailModalComponent, StatusBadgeComponent, SkeletonLoaderComponent],
  templateUrl: './task-schedule.component.html',
  styleUrl: './task-schedule.component.css'
})
export class TaskScheduleComponent implements OnInit {
  private taskService = inject(TaskService);
  private teamService = inject(TeamService);
  public authService = inject(AuthService);
  private toast = inject(ToastService);

  allTasks = signal<TaskItem[]>([]);
  teams = signal<Team[]>([]);
  loading = signal<boolean>(true);

  // Selected date ISO string formatted as YYYY-MM-DD
  selectedDateString = signal<string>(this.formatIsoDate(new Date()));

  // Active user filter for the selected date
  selectedAssigneeId: number | null = null;

  // Detail popup modal state
  showDetailModal = signal<boolean>(false);
  selectedTaskForPopup = signal<TaskItem | null>(null);

  selectedDate = computed(() => new Date(this.selectedDateString() + 'T00:00:00'));

  /**
   * Set of team IDs managed by the currently logged-in manager.
   */
  managedTeamIds = computed(() => {
    const user = this.authService.currentUser();
    if (!user) return new Set<number>();
    return new Set(
      this.teams()
        .filter(t => t.managerId === user.id)
        .map(t => t.id)
    );
  });

  /**
   * Role-based task scoping for calendar:
   * - Admin: Full enterprise view (all tasks across all teams).
   * - Manager: Only tasks in teams managed by the manager or assigned to the manager.
   * - User: Strictly only tasks assigned to the current user.
   */
  scopedTasks = computed(() => {
    const tasks = this.allTasks();
    const user = this.authService.currentUser();
    if (!user) return [];

    // 1. Admin: View all tasks
    if (this.authService.isAdmin()) {
      return tasks;
    }

    // 2. Manager: View tasks belonging to managed teams or assigned to manager
    if (this.authService.isManager()) {
      const managedIds = this.managedTeamIds();
      return tasks.filter(t => 
        (t.teamId && managedIds.has(t.teamId)) ||
        t.assignedToUserId === user.id ||
        t.createdById === user.id
      );
    }

    // 3. User: Only view tasks assigned directly to the current user
    return tasks.filter(t => t.assignedToUserId === user.id);
  });

  /**
   * Generates the 7 days of the active week corresponding to the selected date.
   */
  currentWeekDays = computed<CalendarDay[]>(() => {
    const selected = new Date(this.selectedDateString() + 'T00:00:00');
    const dayOfWeek = selected.getDay(); // 0 = Sunday, 1 = Monday...
    const diff = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek; // Monday start
    const monday = new Date(selected);
    monday.setDate(selected.getDate() + diff);

    const todayIso = this.formatIsoDate(new Date());
    const currentSelectedIso = this.selectedDateString();

    const days: CalendarDay[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const iso = this.formatIsoDate(d);
      days.push({
        date: d,
        dateString: iso,
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNumber: d.getDate(),
        isToday: iso === todayIso,
        isSelected: iso === currentSelectedIso,
        taskCount: this.getTaskCountForDate(iso)
      });
    }
    return days;
  });

  availableTaskDates = computed(() => {
    const dateSet = new Set<string>();
    for (const task of this.scopedTasks()) {
      const dateKey = this.extractTaskDateKey(task);
      if (dateKey) dateSet.add(dateKey);
    }
    return Array.from(dateSet).sort();
  });

  tasksForSelectedDate = computed(() => {
    const currentKey = this.selectedDateString();
    return this.scopedTasks().filter(t => this.extractTaskDateKey(t) === currentKey);
  });

  assigneesOnSelectedDate = computed<DayAssigneeSummary[]>(() => {
    const map = new Map<number, DayAssigneeSummary>();
    for (const task of this.tasksForSelectedDate()) {
      if (task.assignedToUserId) {
        const existing = map.get(task.assignedToUserId);
        if (existing) {
          existing.count++;
        } else {
          map.set(task.assignedToUserId, {
            userId: task.assignedToUserId,
            userName: task.assignedToUserName || 'User #' + task.assignedToUserId,
            email: task.assignedToUserEmail || '',
            count: 1
          });
        }
      }
    }
    return Array.from(map.values());
  });

  displayedTasks = computed(() => {
    const dayTasks = this.tasksForSelectedDate();
    if (this.selectedAssigneeId === null) {
      return dayTasks;
    }
    return dayTasks.filter(t => t.assignedToUserId === this.selectedAssigneeId);
  });

  ngOnInit(): void {
    this.teamService.getTeams().subscribe({
      next: (teams) => this.teams.set(teams),
      error: () => {}
    });
    this.reloadAllTasks();
  }

  reloadAllTasks(): void {
    this.loading.set(true);
    this.taskService.getTasks().subscribe({
      next: (tasks) => {
        this.allTasks.set(tasks);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Failed to load scheduled work items.');
        this.loading.set(false);
      }
    });
  }

  stepDate(dayOffset: number): void {
    const cur = new Date(this.selectedDateString() + 'T00:00:00');
    cur.setDate(cur.getDate() + dayOffset);
    this.setDate(this.formatIsoDate(cur));
  }

  stepWeek(weekOffset: number): void {
    const cur = new Date(this.selectedDateString() + 'T00:00:00');
    cur.setDate(cur.getDate() + (weekOffset * 7));
    this.setDate(this.formatIsoDate(cur));
  }

  selectToday(): void {
    this.setDate(this.formatIsoDate(new Date()));
  }

  setDate(isoDateStr: string): void {
    this.selectedDateString.set(isoDateStr);
    this.selectedAssigneeId = null;
  }

  onDateInputChange(newDate: string): void {
    if (newDate) {
      this.setDate(newDate);
    }
  }

  applyAssigneeFilter(): void {
    // Computed signal displayedTasks will reactively update
  }

  openDetailPopup(task: TaskItem): void {
    this.selectedTaskForPopup.set(task);
    this.showDetailModal.set(true);
  }

  getTaskCountForDate(dateKey: string): number {
    return this.scopedTasks().filter(t => this.extractTaskDateKey(t) === dateKey).length;
  }

  private extractTaskDateKey(task: TaskItem): string {
    const raw = task.dueDate || task.createdAt;
    if (!raw) return '';
    return raw.substring(0, 10);
  }

  private formatIsoDate(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  formatChipDate(dateStr: string): string {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  formatMonthYear(d: Date): string {
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  getDayOfWeek(d: Date): string {
    return d.toLocaleDateString('en-US', { weekday: 'long' });
  }

  formatLongDate(d: Date): string {
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }
}
