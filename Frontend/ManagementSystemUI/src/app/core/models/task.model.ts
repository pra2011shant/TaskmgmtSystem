export type TaskStatus = 
  | 'Created'
  | 'Assigned'
  | 'ToDo'
  | 'InProgress'
  | 'Review'
  | 'Done'
  | 'Blocked'
  | 'Rejected'
  | 'Cancelled';

export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Critical' | 'Urgent';

export interface SubTask {
  id: number;
  taskId: number;
  title: string;
  isCompleted: boolean;
  sortOrder: number;
  createdDate: string;
}

export interface TaskAttachment {
  id: number;
  taskId: number;
  fileName: string;
  contentType: string;
  fileSize: number;
  uploadedById: number;
  uploadedByUserName: string;
  createdDate: string;
  downloadUrl: string;
}

export interface TaskComment {
  id: number;
  taskId: number;
  userId: number;
  userName: string;
  userRole: string;
  content: string;
  parentCommentId?: number;
  isEdited?: boolean;
  createdAt: string;
  replies?: TaskComment[];
}

export interface TaskItem {
  id: number;
  title: string;
  description: string;
  status: TaskStatus;
  statusValue: number;
  priority: TaskPriority;
  priorityValue: number;
  category?: string;
  tags?: string;
  estimatedHours?: number;
  actualHours?: number;
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
  subtasksCount: number;
  completedSubtasksCount: number;
  attachmentsCount: number;
  subTasks?: SubTask[];
  attachments?: TaskAttachment[];
}

export interface CreateTaskRequest {
  title: string;
  description: string;
  status: number;
  priority: number;
  category?: string;
  tags?: string;
  estimatedHours?: number;
  actualHours?: number;
  dueDate?: string;
  teamId?: number | null;
  assignedToUserId?: number | null;
  remarks?: string;
  initialSubtasks?: string[];
}

export interface UpdateTaskRequest {
  title: string;
  description: string;
  status: number;
  priority: number;
  category?: string;
  tags?: string;
  estimatedHours?: number;
  actualHours?: number;
  dueDate?: string;
  teamId?: number | null;
  assignedToUserId?: number | null;
  remarks?: string;
}

export interface TaskFilter {
  search?: string;
  status?: number;
  priority?: number;
  category?: string;
  tag?: string;
  teamId?: number;
  assignedToUserId?: number;
  isOverdue?: boolean;
  dueDateFrom?: string;
  dueDateTo?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDescending?: boolean;
}
