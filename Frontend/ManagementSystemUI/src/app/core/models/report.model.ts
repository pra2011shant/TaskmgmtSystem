export interface UserProductivity {
  userId: number;
  userName: string;
  userEmail: string;
  totalAssigned: number;
  completed: number;
  inProgress: number;
  overdue: number;
  completionRate: number;
  totalEstimatedHours: number;
  totalActualHours: number;
}

export interface TeamProductivity {
  teamId: number;
  teamName: string;
  managerName: string;
  memberCount: number;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  completionRate: number;
}
