import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, of, catchError } from 'rxjs';
import { AuthResponse, LoginRequest, RegisterRequest, User } from '../models/auth.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  
  private apiUrl = `${environment.apiUrl}/auth`;

  // ===================== Reactive State using Angular Signals =====================
  currentUser = signal<User | null>(this.getStoredUser());
  token = signal<string | null>(localStorage.getItem('token'));
  refreshToken = signal<string | null>(localStorage.getItem('refreshToken'));
  permissions = signal<string[]>(this.getStoredPermissions());

  // Reactive computed role flags
  isAuthenticated = computed(() => !!this.token() && !!this.currentUser());
  isAdmin = computed(() => this.currentUser()?.role === 'Admin');
  isManager = computed(() => this.currentUser()?.role === 'Manager' || this.currentUser()?.role === 'Admin');
  userRole = computed(() => this.currentUser()?.role || '');

  constructor() {
    if (this.token()) {
      this.fetchCurrentUser().subscribe({
        error: () => this.handleSessionExpiry()
      });
    }
  }

  private getStoredUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  private getStoredPermissions(): string[] {
    const perms = localStorage.getItem('permissions');
    if (!perms) return [];
    try {
      return JSON.parse(perms);
    } catch {
      return [];
    }
  }

  hasPermission(permission: string): boolean {
    if (this.isAdmin()) return true;
    return this.permissions().includes(permission);
  }

  register(payload: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, payload).pipe(
      tap(res => this.handleAuthSuccess(res))
    );
  }

  adminRegisterUser(payload: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, payload);
  }

  login(payload: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, payload).pipe(
      tap(res => this.handleAuthSuccess(res))
    );
  }

  refreshSession(): Observable<AuthResponse> {
    const rfToken = this.refreshToken();
    if (!rfToken) {
      this.logout();
      return of({} as AuthResponse);
    }

    return this.http.post<AuthResponse>(`${this.apiUrl}/refresh-token`, { refreshToken: rfToken }).pipe(
      tap(res => this.handleAuthSuccess(res)),
      catchError(err => {
        this.logout();
        throw err;
      })
    );
  }

  fetchCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/me`).pipe(
      tap(user => {
        this.currentUser.set(user);
        localStorage.setItem('user', JSON.stringify(user));
      })
    );
  }

  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users`);
  }

  private handleAuthSuccess(res: AuthResponse): void {
    if (res.token) {
      this.token.set(res.token);
      localStorage.setItem('token', res.token);
    }
    if (res.refreshToken) {
      this.refreshToken.set(res.refreshToken);
      localStorage.setItem('refreshToken', res.refreshToken);
    }
    if (res.user) {
      this.currentUser.set(res.user);
      localStorage.setItem('user', JSON.stringify(res.user));
    }
    if (res.permissions) {
      this.permissions.set(res.permissions);
      localStorage.setItem('permissions', JSON.stringify(res.permissions));
    }
  }

  private handleSessionExpiry(): void {
    if (this.refreshToken()) {
      this.refreshSession().subscribe({
        error: () => this.logout()
      });
    } else {
      this.logout();
    }
  }

  logout(): void {
    const rfToken = this.refreshToken();
    if (rfToken) {
      this.http.post(`${this.apiUrl}/revoke-token`, { refreshToken: rfToken }).subscribe({
        error: () => {}
      });
    }

    this.currentUser.set(null);
    this.token.set(null);
    this.refreshToken.set(null);
    this.permissions.set([]);

    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('permissions');

    this.router.navigate(['/login']);
  }
}
