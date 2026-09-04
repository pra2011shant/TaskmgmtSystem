/**
 * Authentication & Identity Models
 * 
 * Defines type-safe structures for user entities, authentication requests,
 * session payloads, and administrative tracking properties.
 */

export type UserRole = 'Admin' | 'Manager' | 'User';

export interface User {
  id: number;
  fullName: string;
  email: string;
  role: UserRole;
  createdAt: string;
  createdDate?: string;
  remarks?: string;
  status?: number;
  isDeleted?: boolean;
  lastUpdatedDate?: string;
  createdById?: number;
}

export interface AuthResponse {
  token: string;
  expiration: string;
  user: User;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password?: string;
  role: number; // 1 = Admin, 2 = Manager, 3 = User
  remarks?: string;
}

export interface LoginRequest {
  email: string;
  password?: string;
}
