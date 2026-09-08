import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuditLog, SystemActivityStats, UserPresence, TaskView } from '../models/audit.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuditService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/audit`;

  getLogs(filter?: {
    search?: string;
    entityName?: string;
    module?: string;
    action?: string;
    userId?: number;
    fromDate?: string;
    toDate?: string;
    limit?: number;
  }): Observable<AuditLog[]> {
    let params = new HttpParams().set('limit', (filter?.limit || 100).toString());
    if (filter?.search) params = params.set('search', filter.search);
    if (filter?.entityName) params = params.set('entityName', filter.entityName);
    if (filter?.module) params = params.set('module', filter.module);
    if (filter?.action) params = params.set('action', filter.action);
    if (filter?.userId) params = params.set('userId', filter.userId.toString());
    if (filter?.fromDate) params = params.set('fromDate', filter.fromDate);
    if (filter?.toDate) params = params.set('toDate', filter.toDate);

    return this.http.get<AuditLog[]>(this.apiUrl, { params });
  }

  getStats(): Observable<SystemActivityStats> {
    return this.http.get<SystemActivityStats>(`${this.apiUrl}/stats`);
  }

  getPresence(): Observable<UserPresence[]> {
    return this.http.get<UserPresence[]>(`${this.apiUrl}/presence`);
  }

  sendHeartbeat(): Observable<{ success: boolean; timestamp: string }> {
    return this.http.post<{ success: boolean; timestamp: string }>(`${this.apiUrl}/presence/heartbeat`, {});
  }

  recordTaskView(taskId: number): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(`${this.apiUrl}/task-views/${taskId}`, {});
  }

  getTaskViews(taskId: number): Observable<TaskView[]> {
    return this.http.get<TaskView[]>(`${this.apiUrl}/task-views/${taskId}`);
  }
}

