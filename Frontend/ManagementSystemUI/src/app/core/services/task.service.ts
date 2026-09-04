/**
 * Task Management & Collaborative Discussion Service
 * 
 * Facilitates RESTful API operations for task lifecycles, Kanban status transitions,
 * multi-criteria search filtering, comment threads, and executive dashboard telemetry.
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateTaskRequest, TaskComment, TaskFilter, TaskItem, UpdateTaskRequest } from '../models/task.model';
import { DashboardSummary } from '../models/dashboard.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  /**
   * Retrieves work tasks matching optional query criteria (search, status, priority, team, assignee, overdue).
   */
  getTasks(filter?: TaskFilter): Observable<TaskItem[]> {
    let params = new HttpParams();
    if (filter) {
      if (filter.search) params = params.set('search', filter.search);
      if (filter.status !== undefined && filter.status !== null) params = params.set('status', filter.status.toString());
      if (filter.priority !== undefined && filter.priority !== null) params = params.set('priority', filter.priority.toString());
      if (filter.teamId) params = params.set('teamId', filter.teamId.toString());
      if (filter.assignedToUserId) params = params.set('assignedToUserId', filter.assignedToUserId.toString());
      if (filter.isOverdue) params = params.set('isOverdue', 'true');
    }
    return this.http.get<TaskItem[]>(`${this.apiUrl}/tasks`, { params });
  }

  /**
   * Retrieves detailed specifications for a single task by ID.
   */
  getTaskById(id: number): Observable<TaskItem> {
    return this.http.get<TaskItem>(`${this.apiUrl}/tasks/${id}`);
  }

  /**
   * Provisions a new task entity.
   */
  createTask(payload: CreateTaskRequest): Observable<TaskItem> {
    return this.http.post<TaskItem>(`${this.apiUrl}/tasks`, payload);
  }

  /**
   * Modifies an existing task entity.
   */
  updateTask(id: number, payload: UpdateTaskRequest): Observable<TaskItem> {
    return this.http.put<TaskItem>(`${this.apiUrl}/tasks/${id}`, payload);
  }

  /**
   * Updates task status value (ToDo -> InProgress -> Done).
   */
  updateTaskStatus(id: number, status: number): Observable<TaskItem> {
    return this.http.patch<TaskItem>(`${this.apiUrl}/tasks/${id}/status`, { status });
  }

  /**
   * Logically soft-deletes a task by ID.
   */
  deleteTask(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/tasks/${id}`);
  }

  /**
   * Retrieves chronological discussion comments for a task.
   */
  getComments(taskId: number): Observable<TaskComment[]> {
    return this.http.get<TaskComment[]>(`${this.apiUrl}/tasks/${taskId}/comments`);
  }

  /**
   * Appends a new discussion comment to a task thread.
   */
  addComment(taskId: number, content: string): Observable<TaskComment> {
    return this.http.post<TaskComment>(`${this.apiUrl}/tasks/${taskId}/comments`, { content });
  }

  /**
   * Retrieves aggregated KPI counters, status breakdowns, and recent feeds for dashboard display.
   */
  getDashboardStats(): Observable<DashboardSummary> {
    return this.http.get<DashboardSummary>(`${this.apiUrl}/dashboard/stats`);
  }
}
