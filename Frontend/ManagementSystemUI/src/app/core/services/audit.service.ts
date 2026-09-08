import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuditLog } from '../models/audit.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuditService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/audit`;

  getLogs(entityName?: string, entityId?: string, userId?: number, action?: string, limit: number = 100): Observable<AuditLog[]> {
    let params = new HttpParams().set('limit', limit.toString());
    if (entityName) params = params.set('entityName', entityName);
    if (entityId) params = params.set('entityId', entityId);
    if (userId) params = params.set('userId', userId.toString());
    if (action) params = params.set('action', action);

    return this.http.get<AuditLog[]>(this.apiUrl, { params });
  }
}
