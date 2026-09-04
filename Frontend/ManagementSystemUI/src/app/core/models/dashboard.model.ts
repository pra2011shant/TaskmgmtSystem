// ==============================================================================================
// 📊 DASHBOARD ANALYTICS & STATS MODELS
// ==============================================================================================
// Dashboard screen ke counters, charts aur recent items ke TypeScript interfaces
// ==============================================================================================

import { NotificationItem } from './notification.model';
import { TaskItem } from './task.model';

// Priority breakdown counters (Urgent, High, Medium, Low)
export interface PriorityStat {
  priority: string;
  count: number;
}

// Complete Dashboard Summary payload
export interface DashboardSummary {
  totalTasks: number;          // Total tasks count
  toDoTasks: number;           // Pending / ToDo tasks
  inProgressTasks: number;     // Active in-progress tasks
  doneTasks: number;           // Completed tasks
  overdueTasks: number;        // Due date cross kar chuki tasks
  totalTeams: number;          // Total teams
  totalUsers: number;          // Total registered users
  unreadNotifications: number; // Unread alerts count
  tasksByPriority: PriorityStat[]; // Priority wise distribution
  recentTasks: TaskItem[];     // Latest 5 tasks
  recentNotifications: NotificationItem[]; // Latest alerts
}
