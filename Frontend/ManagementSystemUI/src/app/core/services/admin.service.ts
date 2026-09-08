import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PermissionsMatrixResponse, SystemStats } from '../models/admin.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/admin`;

  getPermissionsMatrix(): Observable<PermissionsMatrixResponse> {
    return this.http.get<PermissionsMatrixResponse>(`${this.apiUrl}/permissions`);
  }

  updateRolePermissions(role: number, grantedPermissions: string[]): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${this.apiUrl}/permissions`, {
      role,
      grantedPermissions
    });
  }

  getSystemStats(): Observable<SystemStats> {
    return this.http.get<SystemStats>(`${this.apiUrl}/system-stats`);
  }
}
