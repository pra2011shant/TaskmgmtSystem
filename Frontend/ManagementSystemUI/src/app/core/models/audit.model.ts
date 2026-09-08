export interface AuditLog {
  id: number;
  userId?: number;
  userName?: string;
  userRole?: string;
  action: string;
  entityName: string;
  entityId?: string;
  oldValueJson?: string;
  newValueJson?: string;
  ipAddress?: string;
  timestamp: string;
}
