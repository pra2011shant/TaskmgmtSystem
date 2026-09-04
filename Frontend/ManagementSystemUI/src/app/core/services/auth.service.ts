/**
 * Authentication & Identity State Service
 * 
 * Manages user credentials, JWT session persistence, and reactive identity states
 * using modern Angular Signals (`currentUser`, `token`, `isAuthenticated`, `userRole`).
 */

import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { AuthResponse, LoginRequest, RegisterRequest, User } from '../models/auth.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  
  // REST API endpoint for authentication controllers
  private apiUrl = `${environment.apiUrl}/auth`;

  // ===================== Reactive State using Angular Signals =====================
  currentUser = signal<User | null>(this.getStoredUser());
  token = signal<string | null>(localStorage.getItem('token'));

  // Reactive computed role flags
  isAuthenticated = computed(() => !!this.token() && !!this.currentUser());
  isAdmin = computed(() => this.currentUser()?.role === 'Admin');
  isManager = computed(() => this.currentUser()?.role === 'Manager' || this.currentUser()?.role === 'Admin');
  userRole = computed(() => this.currentUser()?.role || '');

  constructor() {
    // Validate existing session token against server profile endpoint
    if (this.token()) {
      this.fetchCurrentUser().subscribe({
        error: () => this.logout()
      });
    }
  }

  /**
   * Retrieves user session profile cached in browser localStorage.
   */
  private getStoredUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  /**
   * Dispatches new user registration request to API (for public self-registration if enabled).
   */
  register(payload: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, payload).pipe(
      tap(res => this.handleAuthSuccess(res))
    );
  }

  /**
   * Provisions a new user account without replacing the active administrator session token.
   */
  adminRegisterUser(payload: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, payload);
  }

  /**
   * Authenticates user credentials with API and establishes session tokens.
   */
  login(payload: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, payload).pipe(
      tap(res => this.handleAuthSuccess(res))
    );
  }

  /**
   * Fetches active user identity claims from server profile endpoint.
   */
  fetchCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/me`).pipe(
      tap(user => {
        this.currentUser.set(user);
        localStorage.setItem('user', JSON.stringify(user));
      })
    );
  }

  /**
   * Retrieves active users directory for assignment selection.
   */
  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users`);
  }

  /**
   * Terminates active session, clears localStorage, and redirects to login screen.
   */
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.token.set(null);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  /**
   * Persists authentication response token and user profile into reactive state and localStorage.
   */
  private handleAuthSuccess(res: AuthResponse): void {
    localStorage.setItem('token', res.token);
    localStorage.setItem('user', JSON.stringify(res.user));
    this.token.set(res.token);
    this.currentUser.set(res.user);
  }
}
