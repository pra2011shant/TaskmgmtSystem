import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TimeLog, StartTimerRequest, ManualTimeLogRequest } from '../models/time-tracking.model';

@Injectable({
  providedIn: 'root'
})
export class TimeTrackingService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/timetracking`;

  getActiveTimer(): Observable<TimeLog | null> {
    return this.http.get<TimeLog | null>(`${this.apiUrl}/active`);
  }

  startTimer(request: StartTimerRequest): Observable<TimeLog> {
    return this.http.post<TimeLog>(`${this.apiUrl}/start`, request);
  }

  stopTimer(taskId: number): Observable<TimeLog> {
    return this.http.post<TimeLog>(`${this.apiUrl}/stop/${taskId}`, {});
  }

  logManualTime(request: ManualTimeLogRequest): Observable<TimeLog> {
    return this.http.post<TimeLog>(`${this.apiUrl}/manual`, request);
  }

  getTaskLogs(taskId: number): Observable<TimeLog[]> {
    return this.http.get<TimeLog[]>(`${this.apiUrl}/task/${taskId}`);
  }

  getMyLogs(fromDate?: string, toDate?: string): Observable<TimeLog[]> {
    let params: any = {};
    if (fromDate) params.fromDate = fromDate;
    if (toDate) params.toDate = toDate;
    return this.http.get<TimeLog[]>(`${this.apiUrl}/my-logs`, { params });
  }
}
