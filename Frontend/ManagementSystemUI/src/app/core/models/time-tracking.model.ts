export interface TimeLog {
  id: number;
  taskId: number;
  taskTitle?: string;
  userId: number;
  userName?: string;
  startTime: string;
  endTime?: string;
  durationMinutes: number;
  description?: string;
  isRunning: boolean;
}

export interface StartTimerRequest {
  taskId: number;
  description?: string;
}

export interface ManualTimeLogRequest {
  taskId: number;
  durationMinutes: number;
  description?: string;
  logDate?: string;
}

export interface LeaderboardUser {
  rank: number;
  userId: number;
  fullName: string;
  email: string;
  role: string;
  department?: string;
  completedTasksCount: number;
  onTimeTasksCount: number;
  totalHoursLogged: number;
  totalScore: number;
  badge: string;
  streakDays: number;
}
