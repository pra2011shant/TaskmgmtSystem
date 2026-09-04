// ==============================================================================================
// 👥 TEAM & TEAM MEMBERS MODELS
// ==============================================================================================
// Yeh file Teams aur unke Members ke data models define karti hai.
// ==============================================================================================

// Team ke andar ke member ki information
export interface TeamMember {
  id: number;
  userId: number;
  fullName: string;
  email: string;
  role: string;
  joinedAt: string;
}

// Complete Team details with Manager aur Members list
export interface Team {
  id: number;
  name: string;
  description: string;
  managerId?: number;
  managerName?: string;
  managerEmail?: string;
  createdAt: string;
  members: TeamMember[];
  tasksCount: number;
}

// Nayi team create karne ya update karne ka payload
export interface CreateTeamRequest {
  name: string;
  description: string;
  managerId?: number | null;
}
