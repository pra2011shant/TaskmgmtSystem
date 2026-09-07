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
  template: `
    <div class="schedule-page">
      <!-- Role-Based Calendar Scope Banner -->
      <div class="role-scope-banner" [ngClass]="'scope-' + (authService.userRole() | lowercase)">
        <div class="scope-icon-wrap">
          <i *ngIf="authService.isAdmin()" class="fa-solid fa-shield-halved"></i>
          <i *ngIf="authService.isManager() && !authService.isAdmin()" class="fa-solid fa-user-tie"></i>
          <i *ngIf="!authService.isManager()" class="fa-solid fa-user-check"></i>
        </div>
        <div class="scope-text-wrap">
          <div class="scope-title-row">
            <strong *ngIf="authService.isAdmin()">Enterprise Admin Calendar Scope</strong>
            <strong *ngIf="authService.isManager() && !authService.isAdmin()">Team Manager Calendar Scope</strong>
            <strong *ngIf="!authService.isManager()">Personal Member Deliverables Scope</strong>
            <span class="scope-pill-tag">{{ authService.userRole() }}</span>
          </div>
          <p *ngIf="authService.isAdmin()">
            Viewing all scheduled deliverables across all departments, teams, and employees.
          </p>
          <p *ngIf="authService.isManager() && !authService.isAdmin()">
            Viewing scheduled deliverables strictly for your managed teams and supervised team members.
          </p>
          <p *ngIf="!authService.isManager()">
            Viewing only your personal assigned deliverables and deadlines ({{ authService.currentUser()?.fullName }}).
          </p>
        </div>
      </div>

      <!-- Hero Header & Global Date Controls -->
      <div class="schedule-hero card">
        <div class="hero-left">
          <div class="hero-tag">
            <i class="fa-solid fa-calendar-check"></i>
            <span>Interactive Timeline & Calendar</span>
          </div>
          <h2 class="hero-title">Assignment Schedule</h2>
          <p class="hero-desc">
            Organize and monitor deliverables date-wise. Click on days to inspect tasks and filter by assignees.
          </p>
        </div>

        <div class="hero-controls">
          <div class="stepper-glass">
            <button class="step-btn" (click)="stepDate(-1)" title="Previous Day">
              <i class="fa-solid fa-chevron-left"></i>
            </button>
            <div class="picker-box">
              <i class="fa-regular fa-calendar-days text-primary"></i>
              <input 
                type="date" 
                class="stepper-input" 
                [ngModel]="selectedDateString()" 
                (ngModelChange)="onDateInputChange($event)"
              />
            </div>
            <button class="step-btn" (click)="stepDate(1)" title="Next Day">
              <i class="fa-solid fa-chevron-right"></i>
            </button>
          </div>

          <button class="btn btn-primary btn-sm today-btn" (click)="selectToday()">
            <i class="fa-solid fa-clock-rotate-left"></i> Today
          </button>
        </div>
      </div>

      <!-- 7-Day Interactive Week Strip (Calendar View) -->
      <div class="week-strip-card card">
        <div class="week-header">
          <div class="month-title">
            <i class="fa-regular fa-calendar text-primary"></i>
            <span>{{ formatMonthYear(selectedDate()) }}</span>
          </div>
          <div class="week-nav">
            <button class="week-nav-btn" (click)="stepWeek(-1)" title="Previous Week">
              <i class="fa-solid fa-arrow-left"></i> Prev Week
            </button>
            <button class="week-nav-btn" (click)="stepWeek(1)" title="Next Week">
              Next Week <i class="fa-solid fa-arrow-right"></i>
            </button>
          </div>
        </div>

        <div class="week-days-grid">
          <div 
            *ngFor="let day of currentWeekDays()" 
            class="week-day-cell" 
            [class.active]="day.isSelected"
            [class.is-today]="day.isToday"
            (click)="setDate(day.dateString)"
          >
            <span class="cell-day-name">{{ day.dayName }}</span>
            <span class="cell-day-number">{{ day.dayNumber }}</span>
            <div class="cell-footer">
              <span *ngIf="day.taskCount > 0" class="task-indicator-dot" [title]="day.taskCount + ' tasks'">
                {{ day.taskCount }}
              </span>
              <span *ngIf="day.taskCount === 0" class="empty-dot"></span>
            </div>
          </div>
        </div>
      </div>

      <!-- Active Dates Quick Ribbon -->
      <div class="quick-dates-bar card" *ngIf="availableTaskDates().length > 0">
        <div class="ribbon-label">
          <i class="fa-solid fa-bolt text-warning"></i>
          <span>Active Task Dates:</span>
        </div>
        <div class="quick-chips-scroll">
          <button 
            *ngFor="let dateStr of availableTaskDates()" 
            class="date-chip" 
            [class.active]="dateStr === selectedDateString()"
            (click)="setDate(dateStr)"
          >
            <span>{{ formatChipDate(dateStr) }}</span>
            <span class="chip-count">{{ getTaskCountForDate(dateStr) }}</span>
          </button>
        </div>
      </div>

      <!-- Selected Day Overview & Assignee Filter Bar -->
      <div class="day-overview-card card">
        <div class="overview-left">
          <div class="date-badge-box">
            <span class="badge-weekday">{{ getDayOfWeek(selectedDate()) }}</span>
            <span class="badge-date">{{ formatLongDate(selectedDate()) }}</span>
          </div>
          <div class="day-count-tag">
            <i class="fa-solid fa-list-check"></i>
            <span>{{ tasksForSelectedDate().length }} Deliverable{{ tasksForSelectedDate().length === 1 ? '' : 's' }}</span>
          </div>
        </div>

        <!-- Assignee Dropdown Filter (Visible only for Managers & Admins) -->
        <div class="overview-right" *ngIf="tasksForSelectedDate().length > 0 && authService.isManager()">
          <div class="assignee-select-wrap">
            <i class="fa-solid fa-user-filter text-primary"></i>
            <select 
              class="form-select assignee-dropdown" 
              [(ngModel)]="selectedAssigneeId"
              (ngModelChange)="applyAssigneeFilter()"
            >
              <option [ngValue]="null">All Managed Members ({{ tasksForSelectedDate().length }} tasks)</option>
              <option *ngFor="let assignee of assigneesOnSelectedDate()" [ngValue]="assignee.userId">
                {{ assignee.userName }} ({{ assignee.count }} {{ assignee.count === 1 ? 'task' : 'tasks' }})
              </option>
            </select>
          </div>
        </div>

        <!-- Personal Deliverables Tag for Standard Users -->
        <div class="overview-right" *ngIf="!authService.isManager()">
          <span class="user-scope-indicator">
            <i class="fa-solid fa-user-check"></i> Your Personal Deliverables
          </span>
        </div>
      </div>

      <!-- Assignee Quick Filter Pills (Manager & Admin only) -->
      <div class="assignee-pills-wrap" *ngIf="authService.isManager() && assigneesOnSelectedDate().length > 1">
        <span class="pills-legend">Filter by Team Member:</span>
        <div class="pills-list">
          <button 
            type="button" 
            class="filter-pill" 
            [class.active]="selectedAssigneeId === null"
            (click)="selectedAssigneeId = null; applyAssigneeFilter()"
          >
            <span>All Members</span>
            <span class="pill-cnt">{{ tasksForSelectedDate().length }}</span>
          </button>
          <button 
            type="button" 
            *ngFor="let u of assigneesOnSelectedDate()" 
            class="filter-pill" 
            [class.active]="selectedAssigneeId === u.userId"
            (click)="selectedAssigneeId = u.userId; applyAssigneeFilter()"
          >
            <span class="avatar-circle">{{ u.userName.charAt(0) }}</span>
            <span>{{ u.userName }}</span>
            <span class="pill-cnt">{{ u.count }}</span>
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <app-skeleton-loader *ngIf="loading()" type="cards" [count]="3"></app-skeleton-loader>

      <!-- Tasks Grid for Selected Date -->
      <div *ngIf="!loading()" class="tasks-section">
        <div class="tasks-grid" *ngIf="displayedTasks().length > 0">
          <div 
            *ngFor="let task of displayedTasks()" 
            class="task-card-modern"
            [ngClass]="'status-border-' + (task.status | lowercase)"
            (click)="openDetailPopup(task)"
          >
            <div class="card-top-row">
              <div class="status-tags">
                <app-status-badge type="status" [value]="task.status" [size]="'sm'"></app-status-badge>
                <app-status-badge type="priority" [value]="task.priority" [size]="'sm'"></app-status-badge>
              </div>
              <span *ngIf="task.teamName" class="team-badge">
                <i class="fa-solid fa-users"></i> {{ task.teamName }}
              </span>
            </div>

            <h3 class="task-title-text">{{ task.title }}</h3>
            <p class="task-desc-text">{{ task.description || 'No description specifications provided.' }}</p>

            <div class="card-bottom-row">
              <div class="assignee-badge">
                <div class="avatar-gradient">
                  {{ (task.assignedToUserName || '?').charAt(0) }}
                </div>
                <div class="assignee-meta">
                  <span class="name">{{ task.assignedToUserName || 'Unassigned' }}</span>
                  <span class="role">Assignee</span>
                </div>
              </div>

              <div class="card-tools">
                <span *ngIf="task.commentsCount > 0" class="comments-badge" title="Discussion comments">
                  <i class="fa-regular fa-comment-dots"></i> {{ task.commentsCount }}
                </span>
                <button class="details-button">
                  <i class="fa-regular fa-eye"></i> Details
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div *ngIf="displayedTasks().length === 0" class="card empty-schedule-box">
          <div class="empty-icon-circle">
            <i class="fa-regular fa-calendar-xmark"></i>
          </div>
          <h3>No Deliverables Scheduled</h3>
          <p>There are no tasks assigned or scheduled for delivery on this date.</p>
          <div class="empty-actions" *ngIf="availableTaskDates().length > 0">
            <span>Next available date:</span>
            <button 
              class="btn btn-primary btn-sm" 
              (click)="setDate(availableTaskDates()[0])"
            >
              View {{ formatChipDate(availableTaskDates()[0]) }} <i class="fa-solid fa-arrow-right"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- Task Details Full Popup Modal -->
      <app-task-detail-modal
        *ngIf="showDetailModal() && selectedTaskForPopup()"
        [task]="selectedTaskForPopup()!"
        (statusChanged)="reloadAllTasks()"
        (closed)="showDetailModal.set(false)"
      ></app-task-detail-modal>
    </div>
  `,
  styles: [`
    .schedule-page {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    /* Role Scope Banner */
    .role-scope-banner {
      display: flex;
      align-items: center;
      gap: 1.25rem;
      padding: 1.125rem 1.5rem;
      border-radius: var(--radius-xl);
      border: 1px solid var(--slate-200);
      background: #ffffff;
      box-shadow: var(--shadow-sm);
      transition: all 0.2s ease;
    }

    .scope-admin {
      border-left: 5px solid #7c3aed;
      background: linear-gradient(135deg, #ffffff, #faf5ff);
    }

    .scope-manager {
      border-left: 5px solid #0284c7;
      background: linear-gradient(135deg, #ffffff, #f0f9ff);
    }

    .scope-user {
      border-left: 5px solid #059669;
      background: linear-gradient(135deg, #ffffff, #ecfdf5);
    }

    .scope-icon-wrap {
      width: 44px;
      height: 44px;
      border-radius: var(--radius-lg);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      flex-shrink: 0;
    }

    .scope-admin .scope-icon-wrap {
      background: #f5f3ff;
      color: #7c3aed;
      border: 1px solid #ddd6fe;
    }

    .scope-manager .scope-icon-wrap {
      background: #f0f9ff;
      color: #0284c7;
      border: 1px solid #bae6fd;
    }

    .scope-user .scope-icon-wrap {
      background: #ecfdf5;
      color: #059669;
      border: 1px solid #a7f3d0;
    }

    .scope-text-wrap {
      flex: 1;
    }

    .scope-title-row {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      margin-bottom: 0.25rem;
    }

    .scope-title-row strong {
      font-size: 0.9375rem;
      color: var(--slate-900);
      font-weight: 800;
    }

    .scope-pill-tag {
      font-size: 0.6875rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 0.125rem 0.5rem;
      border-radius: var(--radius-full);
      background: var(--slate-100);
      color: var(--slate-700);
      border: 1px solid var(--slate-300);
    }

    .scope-text-wrap p {
      font-size: 0.8125rem;
      color: var(--slate-600);
      margin: 0;
      line-height: 1.4;
    }

    .user-scope-indicator {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: #ecfdf5;
      color: #065f46;
      border: 1px solid #a7f3d0;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.4rem 0.875rem;
      border-radius: var(--radius-full);
    }

    /* Hero Card */
    .schedule-hero {
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(248, 250, 252, 0.9));
      padding: 1.75rem 2rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1.5rem;
      flex-wrap: wrap;
      border-left: 5px solid var(--primary-600);
    }

    .hero-tag {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--primary-600);
      background: var(--primary-50);
      border: 1px solid var(--primary-200);
      padding: 0.25rem 0.75rem;
      border-radius: var(--radius-full);
      margin-bottom: 0.5rem;
    }

    .hero-title {
      font-size: 1.75rem;
      font-weight: 800;
      color: var(--slate-900);
      margin: 0;
      letter-spacing: -0.02em;
    }

    .hero-desc {
      font-size: 0.875rem;
      color: var(--slate-500);
      margin: 0.25rem 0 0;
      max-width: 600px;
    }

    .hero-controls {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .stepper-glass {
      display: flex;
      align-items: center;
      background: #ffffff;
      border: 1px solid var(--slate-200);
      border-radius: var(--radius-lg);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
      overflow: hidden;
    }

    .step-btn {
      background: transparent;
      border: none;
      padding: 0.625rem 0.875rem;
      color: var(--slate-600);
      cursor: pointer;
      transition: all 0.15s;
    }

    .step-btn:hover {
      background: var(--slate-100);
      color: var(--primary-600);
    }

    .picker-box {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0 0.625rem;
      border-left: 1px solid var(--slate-100);
      border-right: 1px solid var(--slate-100);
    }

    .stepper-input {
      border: none;
      font-weight: 700;
      font-size: 0.875rem;
      color: var(--slate-800);
      padding: 0.5rem 0.25rem;
      cursor: pointer;
      outline: none;
    }

    .today-btn {
      box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
    }

    /* 7-Day Week Strip */
    .week-strip-card {
      padding: 1.25rem 1.75rem;
    }

    .week-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1rem;
    }

    .month-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 1rem;
      font-weight: 700;
      color: var(--slate-800);
    }

    .week-nav {
      display: flex;
      gap: 0.5rem;
    }

    .week-nav-btn {
      background: var(--slate-100);
      border: 1px solid var(--slate-200);
      border-radius: var(--radius-md);
      padding: 0.3125rem 0.625rem;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--slate-600);
      cursor: pointer;
      transition: all 0.15s;
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
    }

    .week-nav-btn:hover {
      background: #ffffff;
      color: var(--primary-600);
      border-color: var(--primary-300);
    }

    .week-days-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 0.625rem;
    }

    @media (max-width: 768px) {
      .week-days-grid {
        grid-template-columns: repeat(4, 1fr);
      }
    }

    .week-day-cell {
      background: rgba(248, 250, 252, 0.8);
      border: 1.5px solid var(--slate-200);
      border-radius: var(--radius-lg);
      padding: 0.875rem 0.5rem;
      text-align: center;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.25rem;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      user-select: none;
    }

    .week-day-cell:hover {
      background: #ffffff;
      border-color: var(--primary-300);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.12);
    }

    .week-day-cell.active {
      background: linear-gradient(135deg, var(--primary-600), var(--primary-700));
      color: #ffffff;
      border-color: var(--primary-600);
      box-shadow: 0 8px 18px rgba(79, 70, 229, 0.35);
      transform: translateY(-2px);
    }

    .cell-day-name {
      font-size: 0.6875rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--slate-500);
    }

    .week-day-cell.active .cell-day-name {
      color: var(--primary-100);
    }

    .cell-day-number {
      font-size: 1.375rem;
      font-weight: 800;
      color: var(--slate-900);
      line-height: 1.2;
    }

    .week-day-cell.active .cell-day-number {
      color: #ffffff;
    }

    .cell-footer {
      margin-top: 0.25rem;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .task-indicator-dot {
      background: var(--primary-500);
      color: #ffffff;
      font-size: 0.625rem;
      font-weight: 800;
      padding: 0.1rem 0.4rem;
      border-radius: var(--radius-full);
      box-shadow: 0 2px 4px rgba(99, 102, 241, 0.3);
    }

    .week-day-cell.active .task-indicator-dot {
      background: #ffffff;
      color: var(--primary-700);
    }

    .empty-dot {
      width: 4px;
      height: 4px;
      background: var(--slate-300);
      border-radius: 9999px;
    }

    /* Quick Dates Ribbon */
    .quick-dates-bar {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.75rem 1.25rem;
      overflow-x: auto;
    }

    .ribbon-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--slate-600);
      text-transform: uppercase;
      white-space: nowrap;
    }

    .quick-chips-scroll {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      overflow-x: auto;
    }

    .date-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.3125rem 0.75rem;
      border-radius: var(--radius-full);
      border: 1px solid var(--slate-200);
      background: var(--slate-50);
      color: var(--slate-700);
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s;
      white-space: nowrap;
    }

    .date-chip:hover {
      border-color: var(--primary-400);
      color: var(--primary-600);
      background: #ffffff;
    }

    .date-chip.active {
      background: var(--slate-900);
      color: #ffffff;
      border-color: var(--slate-900);
      box-shadow: 0 4px 10px rgba(15, 23, 42, 0.2);
    }

    .chip-count {
      background: rgba(0, 0, 0, 0.08);
      padding: 0.125rem 0.375rem;
      border-radius: 9999px;
      font-size: 0.625rem;
    }

    .date-chip.active .chip-count {
      background: rgba(255, 255, 255, 0.25);
      color: #ffffff;
    }

    /* Day Overview Card */
    .day-overview-card {
      padding: 1.25rem 1.75rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1.5rem;
      flex-wrap: wrap;
      background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
    }

    .overview-left {
      display: flex;
      align-items: center;
      gap: 1.25rem;
    }

    .date-badge-box {
      display: flex;
      flex-direction: column;
    }

    .badge-weekday {
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--primary-600);
    }

    .badge-date {
      font-size: 1.25rem;
      font-weight: 800;
      color: var(--slate-900);
      line-height: 1.2;
    }

    .day-count-tag {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: var(--primary-50);
      color: var(--primary-700);
      border: 1px solid var(--primary-200);
      padding: 0.375rem 0.875rem;
      border-radius: var(--radius-full);
      font-size: 0.8125rem;
      font-weight: 700;
    }

    .assignee-select-wrap {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: #ffffff;
      border: 1.5px solid var(--slate-300);
      border-radius: var(--radius-lg);
      padding: 0.25rem 0.75rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    }

    .assignee-dropdown {
      border: none;
      padding: 0.375rem 0.25rem;
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--slate-800);
      background: transparent;
      outline: none;
      cursor: pointer;
      min-width: 220px;
    }

    /* Assignee Filter Pills */
    .assignee-pills-wrap {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .pills-legend {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--slate-500);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .pills-list {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .filter-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.3125rem 0.75rem;
      border-radius: var(--radius-full);
      border: 1px solid var(--slate-200);
      background: #ffffff;
      color: var(--slate-700);
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s;
    }

    .filter-pill:hover {
      background: var(--slate-100);
      border-color: var(--slate-300);
    }

    .filter-pill.active {
      background: var(--slate-900);
      color: #ffffff;
      border-color: var(--slate-900);
    }

    .avatar-circle {
      width: 18px;
      height: 18px;
      border-radius: 9999px;
      background: var(--primary-100);
      color: var(--primary-700);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 0.625rem;
      font-weight: 800;
    }

    .filter-pill.active .avatar-circle {
      background: rgba(255, 255, 255, 0.2);
      color: #ffffff;
    }

    .pill-cnt {
      background: var(--slate-100);
      color: var(--slate-600);
      padding: 0.125rem 0.375rem;
      border-radius: 9999px;
      font-size: 0.625rem;
      font-weight: 800;
    }

    .filter-pill.active .pill-cnt {
      background: rgba(255, 255, 255, 0.25);
      color: #ffffff;
    }

    /* Tasks Modern Grid */
    .tasks-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
      gap: 1.25rem;
    }

    .task-card-modern {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(226, 232, 240, 0.9);
      border-radius: var(--radius-xl);
      padding: 1.375rem;
      box-shadow: 0 4px 16px -2px rgba(15, 23, 42, 0.05);
      display: flex;
      flex-direction: column;
      gap: 0.875rem;
      cursor: pointer;
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      position: relative;
    }

    .task-card-modern:hover {
      transform: translateY(-3px);
      box-shadow: 0 12px 28px -4px rgba(99, 102, 241, 0.15);
      border-color: var(--primary-300);
    }

    .status-border-todo { border-left: 4px solid var(--slate-400); }
    .status-border-inprogress { border-left: 4px solid var(--primary-500); }
    .status-border-done { border-left: 4px solid var(--success); }

    .card-top-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
    }

    .status-tags {
      display: flex;
      align-items: center;
      gap: 0.375rem;
    }

    .team-badge {
      font-size: 0.6875rem;
      font-weight: 600;
      color: var(--slate-500);
      background: var(--slate-100);
      padding: 0.25rem 0.5rem;
      border-radius: var(--radius-sm);
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
    }

    .task-title-text {
      font-size: 1.0625rem;
      font-weight: 700;
      color: var(--slate-900);
      margin: 0;
      line-height: 1.35;
    }

    .task-desc-text {
      font-size: 0.8125rem;
      color: var(--slate-500);
      margin: 0;
      line-height: 1.5;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .card-bottom-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      padding-top: 0.875rem;
      border-top: 1px solid var(--slate-100);
      margin-top: auto;
    }

    .assignee-badge {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .avatar-gradient {
      width: 32px;
      height: 32px;
      border-radius: 9999px;
      background: linear-gradient(135deg, var(--primary-600), var(--primary-800));
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: 700;
      box-shadow: 0 2px 6px rgba(79, 70, 229, 0.3);
    }

    .assignee-meta {
      display: flex;
      flex-direction: column;
    }

    .assignee-meta .name {
      font-size: 0.8125rem;
      font-weight: 700;
      color: var(--slate-800);
      line-height: 1.2;
    }

    .assignee-meta .role {
      font-size: 0.6875rem;
      color: var(--slate-400);
    }

    .card-tools {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .comments-badge {
      font-size: 0.75rem;
      color: var(--slate-500);
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
    }

    .details-button {
      background: var(--slate-50);
      border: 1px solid var(--slate-200);
      border-radius: var(--radius-md);
      color: var(--slate-700);
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.375rem 0.625rem;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      transition: all 0.15s;
    }

    .details-button:hover {
      background: var(--primary-50);
      color: var(--primary-600);
      border-color: var(--primary-200);
    }

    .empty-schedule-box {
      padding: 4rem 2rem;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
    }

    .empty-icon-circle {
      width: 64px;
      height: 64px;
      border-radius: 9999px;
      background: var(--slate-100);
      color: var(--slate-400);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.75rem;
      margin-bottom: 0.5rem;
    }

    .empty-schedule-box h3 {
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--slate-800);
      margin: 0;
    }

    .empty-schedule-box p {
      font-size: 0.875rem;
      color: var(--slate-500);
      margin: 0;
    }

    .empty-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-top: 0.75rem;
      font-size: 0.8125rem;
      color: var(--slate-600);
    }
  `]
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
