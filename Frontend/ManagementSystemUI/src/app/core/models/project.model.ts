export interface Milestone {
  id: number;
  projectId: number;
  title: string;
  description?: string;
  dueDate?: string;
  progressPercentage: number;
  milestoneStatus: string;
  tasksCount: number;
  completedTasksCount: number;
}

export interface Project {
  id: number;
  projectKey: string;
  name: string;
  description?: string;
  teamId?: number;
  teamName?: string;
  managerId?: number;
  managerName?: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
  projectStatus: string;
  tasksCount: number;
  completedTasksCount: number;
  completionRate: number;
  milestones: Milestone[];
}

export interface CreateProjectRequest {
  projectKey: string;
  name: string;
  description?: string;
  teamId?: number;
  managerId?: number;
  startDate?: string;
  endDate?: string;
  budget?: number;
}

export interface CreateMilestoneRequest {
  title: string;
  description?: string;
  dueDate?: string;
}
