/**
 * Task Management & Collaboration Models
 * 
 * Defines type-safe structures for tasks, workflows, priorities, comment threads,
 * and administrative audit tracking columns.
 */

export type TaskStatus = 'ToDo' | 'InProgress' | 'Done';
export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export interface TaskItem {
  id: number;
  title: string;
  description: string;
  status: TaskStatus;
  statusValue: number; // 1 = ToDo, 2 = InProgress, 3 = Done
  priority: TaskPriority;
  priorityValue: number; // 1 = Low, 2 = Medium, 3 = High, 4 = Urgent
  dueDate?: string;
  teamId?: number;
  teamName?: string;
  assignedToUserId?: number;
  assignedToUserName?: string;
  assignedToUserEmail?: string;
  createdByUserId: number;
  createdByUserName: string;
  createdAt: string;
  createdDate?: string;
  updatedAt?: string;
  lastUpdatedDate?: string;
  remarks?: string;
  isDeleted?: boolean;
  createdById?: number;
  commentsCount: number;
}

export interface CreateTaskRequest {
  title: string;
  description: string;
  status: number; // 1 = ToDo, 2 = InProgress, 3 = Done
  priority: number; // 1 = Low, 2 = Medium, 3 = High, 4 = Urgent
  dueDate?: string;
  teamId?: number | null;
  assignedToUserId?: number | null;
  remarks?: string;
}

export interface UpdateTaskRequest {
  title: string;
  description: string;
  status: number;
  priority: number;
  dueDate?: string;
  teamId?: number | null;
  assignedToUserId?: number | null;
  remarks?: string;
}

export interface TaskComment {
  id: number;
  taskId: number;
  userId: number;
  userName: string;
  userRole: string;
  content: string;
  createdAt: string;
}

export interface TaskFilter {
  search?: string;
  status?: number;
  priority?: number;
  teamId?: number;
  assignedToUserId?: number;
  isOverdue?: boolean;
}
