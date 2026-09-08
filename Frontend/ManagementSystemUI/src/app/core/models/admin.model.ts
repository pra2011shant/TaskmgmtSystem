export interface PermissionsMatrixResponse {
  allPermissions: string[];
  rolePermissions: {
    [key: string]: string[];
  };
}

export interface SystemStats {
  totalUsers: number;
  totalTeams: number;
  totalTasks: number;
  totalComments: number;
  totalAttachments: number;
  totalAuditLogs: number;
  serverTimeUtc: string;
  frameworkVersion: string;
  databaseEngine: string;
}
