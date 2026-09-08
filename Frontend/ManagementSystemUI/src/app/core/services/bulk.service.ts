import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BulkService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/bulktasks`;

  bulkUpdateStatus(taskIds: number[], newStatus: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/status`, { taskIds, newStatus });
  }

  bulkAssign(taskIds: number[], assignedToUserId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/assign`, { taskIds, assignedToUserId });
  }

  bulkPriority(taskIds: number[], newPriority: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/priority`, { taskIds, newPriority });
  }

  bulkDelete(taskIds: number[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/delete`, { taskIds });
  }
}
