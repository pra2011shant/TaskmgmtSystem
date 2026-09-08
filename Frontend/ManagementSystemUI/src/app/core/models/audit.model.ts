export interface AuditLog {
  id: number;
  userId?: number;
  userName?: string;
  userRole?: string;
  action: string;
  module?: string;
  entityName: string;
  entityId?: string;
  description?: string;
  oldValueJson?: string;
  newValueJson?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

export interface SystemActivityStats {
  activeUsers: number;
  todayLogins: number;
  tasksUpdatedToday: number;
  deletionsToday: number;
  totalAuditLogs: number;
}

export interface UserPresence {
  id: number;
  fullName: string;
  email: string;
  role: string;
  department?: string;
  isOnline: boolean;
  loginTime?: string;
  lastActivity?: string;
  lastLogout?: string;
  lastIpAddress?: string;
  lastUserAgent?: string;
}

export interface TaskView {
  userId: number;
  userName: string;
  userRole?: string;
  viewedAt: string;
}

export interface FieldDiff {
  fieldName: string;
  oldValue: any;
  newValue: any;
  isModified: boolean;
}

