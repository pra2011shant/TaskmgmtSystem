export type UserRole = 'Admin' | 'Manager' | 'User';

export interface User {
  id: number;
  fullName: string;
  email: string;
  role: UserRole;
  department?: string;
  createdAt: string;
  createdDate?: string;
  remarks?: string;
  status?: number;
  isDeleted?: boolean;
  isLockedOut?: boolean;
  lastUpdatedDate?: string;
  createdById?: number;
}

export interface AuthResponse {
  token: string;
  expiration: string;
  refreshToken: string;
  refreshTokenExpiration: string;
  user: User;
  permissions?: string[];
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password?: string;
  role: number; // 1 = Admin, 2 = Manager, 3 = User
  department?: string;
  remarks?: string;
}

export interface LoginRequest {
  email: string;
  password?: string;
}
