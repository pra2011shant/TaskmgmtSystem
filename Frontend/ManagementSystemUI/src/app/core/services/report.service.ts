import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TeamProductivity, UserProductivity } from '../models/report.model';
import { TaskItem } from '../models/task.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/reports`;

  getUserProductivity(): Observable<UserProductivity[]> {
    return this.http.get<UserProductivity[]>(`${this.apiUrl}/user-productivity`);
  }

  getTeamProductivity(): Observable<TeamProductivity[]> {
    return this.http.get<TeamProductivity[]>(`${this.apiUrl}/team-productivity`);
  }

  getOverdueTasks(): Observable<TaskItem[]> {
    return this.http.get<TaskItem[]>(`${this.apiUrl}/overdue-tasks`);
  }

  exportCsv(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/export/csv`, { responseType: 'blob' });
  }

  exportHtml(type: 'user' | 'team'): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/export/html?type=${type}`, { responseType: 'blob' });
  }
}
