import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateTaskRequest, SubTask, TaskAttachment, TaskComment, TaskFilter, TaskItem, UpdateTaskRequest } from '../models/task.model';
import { DashboardSummary } from '../models/dashboard.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getTasks(filter?: TaskFilter): Observable<TaskItem[]> {
    let params = new HttpParams();
    if (filter) {
      if (filter.search) params = params.set('search', filter.search);
      if (filter.status !== undefined && filter.status !== null) params = params.set('status', filter.status.toString());
      if (filter.priority !== undefined && filter.priority !== null) params = params.set('priority', filter.priority.toString());
      if (filter.category) params = params.set('category', filter.category);
      if (filter.tag) params = params.set('tag', filter.tag);
      if (filter.teamId) params = params.set('teamId', filter.teamId.toString());
      if (filter.assignedToUserId) params = params.set('assignedToUserId', filter.assignedToUserId.toString());
      if (filter.isOverdue) params = params.set('isOverdue', 'true');
      if (filter.dueDateFrom) params = params.set('dueDateFrom', filter.dueDateFrom);
      if (filter.dueDateTo) params = params.set('dueDateTo', filter.dueDateTo);
      if (filter.page) params = params.set('page', filter.page.toString());
      if (filter.pageSize) params = params.set('pageSize', filter.pageSize.toString());
      if (filter.sortBy) params = params.set('sortBy', filter.sortBy);
      if (filter.sortDescending) params = params.set('sortDescending', 'true');
    }
    return this.http.get<TaskItem[]>(`${this.apiUrl}/tasks`, { params });
  }

  getTaskById(id: number): Observable<TaskItem> {
    return this.http.get<TaskItem>(`${this.apiUrl}/tasks/${id}`);
  }

  createTask(payload: CreateTaskRequest): Observable<TaskItem> {
    return this.http.post<TaskItem>(`${this.apiUrl}/tasks`, payload);
  }

  updateTask(id: number, payload: UpdateTaskRequest): Observable<TaskItem> {
    return this.http.put<TaskItem>(`${this.apiUrl}/tasks/${id}`, payload);
  }

  updateTaskStatus(id: number, status: number): Observable<TaskItem> {
    return this.http.patch<TaskItem>(`${this.apiUrl}/tasks/${id}/status`, { status });
  }

  deleteTask(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/tasks/${id}`);
  }

  // Subtask operations
  addSubTask(taskId: number, title: string, sortOrder: number = 0): Observable<SubTask> {
    return this.http.post<SubTask>(`${this.apiUrl}/tasks/${taskId}/subtasks`, { title, sortOrder });
  }

  updateSubTask(taskId: number, subTaskId: number, title: string, isCompleted: boolean, sortOrder: number = 0): Observable<SubTask> {
    return this.http.put<SubTask>(`${this.apiUrl}/tasks/${taskId}/subtasks/${subTaskId}`, { title, isCompleted, sortOrder });
  }

  deleteSubTask(taskId: number, subTaskId: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/tasks/${taskId}/subtasks/${subTaskId}`);
  }

  // Comment operations
  getComments(taskId: number): Observable<TaskComment[]> {
    return this.http.get<TaskComment[]>(`${this.apiUrl}/tasks/${taskId}/comments`);
  }

  addComment(taskId: number, content: string, parentCommentId?: number): Observable<TaskComment> {
    return this.http.post<TaskComment>(`${this.apiUrl}/tasks/${taskId}/comments`, { content, parentCommentId });
  }

  updateComment(commentId: number, content: string): Observable<TaskComment> {
    return this.http.put<TaskComment>(`${this.apiUrl}/comments/${commentId}`, { content });
  }

  deleteComment(commentId: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/comments/${commentId}`);
  }

  // Attachment operations
  getAttachments(taskId: number): Observable<TaskAttachment[]> {
    return this.http.get<TaskAttachment[]>(`${this.apiUrl}/attachments/tasks/${taskId}`);
  }

  uploadAttachment(taskId: number, file: File): Observable<TaskAttachment> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<TaskAttachment>(`${this.apiUrl}/attachments/tasks/${taskId}`, formData);
  }

  deleteAttachment(attachmentId: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/attachments/${attachmentId}`);
  }

  getDashboardStats(): Observable<DashboardSummary> {
    return this.http.get<DashboardSummary>(`${this.apiUrl}/dashboard/stats`);
  }
}
