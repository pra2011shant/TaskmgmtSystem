import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Team } from '../../core/models/team.model';
import { User } from '../../core/models/auth.model';
import { TeamService } from '../../core/services/team.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-team-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="teams-page">
      <div class="page-header">
        <div>
          <h2 class="section-title">Team Management</h2>
          <p class="section-desc">Organize workspaces, assign managers, and manage team members.</p>
        </div>

        <button *ngIf="authService.isManager()" class="btn btn-primary" (click)="openCreateModal()">
          <i class="fa-solid fa-plus"></i> Create New Team
        </button>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading()" class="loading-state">
        <i class="fa-solid fa-spinner fa-spin"></i>
        <span>Loading teams...</span>
      </div>

      <!-- Teams Grid -->
      <div *ngIf="!loading()" class="teams-grid">
        <div *ngFor="let team of teams()" class="team-card">
          <div class="team-card-header">
            <div class="team-title-wrap">
              <div class="team-icon">
                <i class="fa-solid fa-users-rectangle"></i>
              </div>
              <div>
                <h3 class="team-name">{{ team.name }}</h3>
                <span class="team-created">Created {{ team.createdAt | date:'mediumDate' }}</span>
              </div>
            </div>

            <div class="team-header-actions" *ngIf="authService.isAdmin()">
              <button class="btn-icon text-danger" (click)="deleteTeam(team.id)" title="Delete Team">
                <i class="fa-solid fa-trash"></i>
              </button>
            </div>
          </div>

          <p class="team-desc">{{ team.description || 'No description provided.' }}</p>

          <!-- Manager Info -->
          <div class="manager-banner">
            <span class="banner-tag">TEAM LEAD / MANAGER</span>
            <div class="manager-info">
              <div class="avatar-sm">{{ (team.managerName || 'M').charAt(0) }}</div>
              <div>
                <strong>{{ team.managerName || 'No Manager Assigned' }}</strong>
                <small>{{ team.managerEmail || '' }}</small>
              </div>
            </div>
          </div>

          <!-- Team Members List -->
          <div class="members-section">
            <div class="members-header">
              <h4>Members ({{ team.members.length }})</h4>
              <button 
                *ngIf="authService.isManager()" 
                class="btn-text-add" 
                (click)="openAddMemberModal(team)"
              >
                <i class="fa-solid fa-user-plus"></i> Add Member
              </button>
            </div>

            <div class="member-chips-list">
              <div *ngFor="let m of team.members" class="member-chip">
                <div class="avatar-chip">{{ m.fullName.charAt(0) }}</div>
                <div class="chip-info">
                  <span class="chip-name">{{ m.fullName }}</span>
                  <span class="chip-role">({{ m.role }})</span>
                </div>
                <button 
                  *ngIf="authService.isManager()" 
                  class="chip-remove" 
                  (click)="removeMember(team.id, m.userId)"
                  title="Remove from team"
                >
                  <i class="fa-solid fa-xmark"></i>
                </button>
              </div>

              <div *ngIf="team.members.length === 0" class="no-members-msg">
                No members assigned to this team yet.
              </div>
            </div>
          </div>

          <!-- Card Footer -->
          <div class="team-card-footer">
            <span class="tasks-count-pill">
              <i class="fa-solid fa-list-check"></i> {{ team.tasksCount }} Active Tasks
            </span>
          </div>
        </div>

        <div *ngIf="teams().length === 0" class="no-teams-card">
          <i class="fa-solid fa-users-slash"></i>
          <h3>No Teams Found</h3>
          <p>Create your first team to start assigning tasks and collaborating.</p>
        </div>
      </div>

      <!-- Modal: Create Team -->
      <div class="modal-overlay" *ngIf="showCreateModal()" (click)="showCreateModal.set(false)">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Create New Team</h3>
            <button class="btn-icon" (click)="showCreateModal.set(false)"><i class="fa-solid fa-xmark"></i></button>
          </div>
          <form (ngSubmit)="saveNewTeam()">
            <div class="modal-body">
              <div class="form-group">
                <label class="form-label">Team Name *</label>
                <input 
                  type="text" 
                  class="form-control" 
                  [(ngModel)]="teamName" 
                  name="teamName" 
                  placeholder="e.g. Frontend Engineering" 
                  required 
                />
              </div>

              <div class="form-group">
                <label class="form-label">Description</label>
                <textarea 
                  class="form-control" 
                  rows="3" 
                  [(ngModel)]="teamDescription" 
                  name="teamDescription" 
                  placeholder="Team scope and responsibilities..."
                ></textarea>
              </div>

              <div class="form-group">
                <label class="form-label">Assign Team Manager</label>
                <select class="form-select" [(ngModel)]="selectedManagerId" name="selectedManagerId">
                  <option [ngValue]="null">Auto (Current User)</option>
                  <option *ngFor="let u of users()" [ngValue]="u.id">{{ u.fullName }} ({{ u.role }})</option>
                </select>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="showCreateModal.set(false)">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="submitting()">Create Team</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Modal: Add Member to Team -->
      <div class="modal-overlay" *ngIf="showMemberModal() && activeTeamForMember()" (click)="showMemberModal.set(false)">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Add Member to '{{ activeTeamForMember()?.name }}'</h3>
            <button class="btn-icon" (click)="showMemberModal.set(false)"><i class="fa-solid fa-xmark"></i></button>
          </div>
          <form (ngSubmit)="saveAddMember()">
            <div class="modal-body">
              <div class="form-group">
                <label class="form-label">Select User to Add</label>
                <select class="form-select" [(ngModel)]="memberToAddUserId" name="memberToAddUserId" required>
                  <option [ngValue]="null" disabled>Choose a user...</option>
                  <option *ngFor="let u of users()" [ngValue]="u.id">
                    {{ u.fullName }} - {{ u.email }} ({{ u.role }})
                  </option>
                </select>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="showMemberModal.set(false)">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="!memberToAddUserId || submitting()">Add Member</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .teams-page {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
    }

    .section-title {
      font-size: 1.375rem;
      font-weight: 800;
      color: var(--slate-900);
      margin: 0;
    }

    .section-desc {
      font-size: 0.8125rem;
      color: var(--slate-500);
      margin: 0.25rem 0 0;
    }

    .teams-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
      gap: 1.5rem;
    }

    .team-card {
      background: #ffffff;
      border: 1px solid var(--slate-200);
      border-radius: var(--radius-xl);
      padding: 1.5rem;
      box-shadow: var(--shadow-sm);
      display: flex;
      flex-direction: column;
      gap: 1rem;
      transition: all 0.2s;
    }

    .team-card:hover {
      box-shadow: var(--shadow-md);
      transform: translateY(-2px);
    }

    .team-card-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
    }

    .team-title-wrap {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .team-icon {
      width: 42px;
      height: 42px;
      border-radius: var(--radius-lg);
      background: linear-gradient(135deg, var(--primary-100), var(--primary-200));
      color: var(--primary-700);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
    }

    .team-name {
      font-size: 1.0625rem;
      font-weight: 800;
      color: var(--slate-900);
      margin: 0;
    }

    .team-created {
      font-size: 0.6875rem;
      color: var(--slate-400);
    }

    .team-desc {
      font-size: 0.8125rem;
      color: var(--slate-600);
      line-height: 1.5;
      margin: 0;
    }

    .manager-banner {
      background: var(--slate-50);
      border: 1px solid var(--slate-200);
      border-radius: var(--radius-md);
      padding: 0.75rem;
    }

    .banner-tag {
      display: block;
      font-size: 0.625rem;
      font-weight: 800;
      color: var(--primary-600);
      letter-spacing: 0.05em;
      margin-bottom: 0.375rem;
    }

    .manager-info {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .manager-info strong {
      display: block;
      font-size: 0.8125rem;
      color: var(--slate-800);
    }

    .manager-info small {
      display: block;
      font-size: 0.6875rem;
      color: var(--slate-500);
    }

    .avatar-sm {
      width: 28px;
      height: 28px;
      border-radius: var(--radius-full);
      background: var(--primary-600);
      color: #ffffff;
      font-size: 0.75rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .members-section {
      border-top: 1px solid var(--slate-100);
      padding-top: 0.75rem;
    }

    .members-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.625rem;
    }

    .members-header h4 {
      font-size: 0.8125rem;
      font-weight: 700;
      color: var(--slate-700);
      margin: 0;
    }

    .btn-text-add {
      background: none;
      border: none;
      color: var(--primary-600);
      font-size: 0.75rem;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .member-chips-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.375rem;
    }

    .member-chip {
      background: var(--slate-100);
      border: 1px solid var(--slate-200);
      border-radius: var(--radius-full);
      padding: 0.25rem 0.5rem;
      display: flex;
      align-items: center;
      gap: 0.375rem;
    }

    .avatar-chip {
      width: 18px;
      height: 18px;
      border-radius: var(--radius-full);
      background: var(--slate-700);
      color: #ffffff;
      font-size: 0.625rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .chip-name {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--slate-800);
    }

    .chip-role {
      font-size: 0.6875rem;
      color: var(--slate-500);
    }

    .chip-remove {
      background: none;
      border: none;
      color: var(--slate-400);
      cursor: pointer;
      padding: 0.125rem;
      font-size: 0.6875rem;
      line-height: 1;
    }

    .chip-remove:hover {
      color: var(--danger);
    }

    .no-members-msg {
      font-size: 0.75rem;
      color: var(--slate-400);
      padding: 0.25rem 0;
    }

    .team-card-footer {
      margin-top: auto;
      border-top: 1px solid var(--slate-100);
      padding-top: 0.75rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .tasks-count-pill {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--slate-600);
      display: flex;
      align-items: center;
      gap: 0.375rem;
    }

    .no-teams-card {
      grid-column: 1 / -1;
      background: #ffffff;
      border: 2px dashed var(--slate-300);
      border-radius: var(--radius-xl);
      padding: 3rem 1.5rem;
      text-align: center;
      color: var(--slate-400);
    }

    .no-teams-card i {
      font-size: 2.5rem;
      margin-bottom: 0.75rem;
      color: var(--slate-300);
    }
  `]
})
export class TeamListComponent implements OnInit {
  teamService = inject(TeamService);
  authService = inject(AuthService);
  toast = inject(ToastService);

  teams = signal<Team[]>([]);
  users = signal<User[]>([]);
  loading = signal(true);
  submitting = signal(false);

  // Modals state
  showCreateModal = signal(false);
  teamName = '';
  teamDescription = '';
  selectedManagerId: number | null = null;

  showMemberModal = signal(false);
  activeTeamForMember = signal<Team | null>(null);
  memberToAddUserId: number | null = null;

  ngOnInit() {
    this.authService.getAllUsers().subscribe(res => this.users.set(res));
    this.loadTeams();
  }

  loadTeams() {
    this.loading.set(true);
    this.teamService.getTeams().subscribe({
      next: (res) => {
        this.teams.set(res);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  openCreateModal() {
    this.teamName = '';
    this.teamDescription = '';
    this.selectedManagerId = null;
    this.showCreateModal.set(true);
  }

  saveNewTeam() {
    if (!this.teamName.trim()) return;

    this.submitting.set(true);
    this.teamService.createTeam({
      name: this.teamName.trim(),
      description: this.teamDescription.trim(),
      managerId: this.selectedManagerId
    }).subscribe({
      next: () => {
        this.submitting.set(false);
        this.showCreateModal.set(false);
        this.toast.success('Team created successfully.');
        this.loadTeams();
      },
      error: (err) => {
        this.submitting.set(false);
        this.toast.error(err.error?.message || 'Failed to create team.');
      }
    });
  }

  openAddMemberModal(team: Team) {
    this.activeTeamForMember.set(team);
    this.memberToAddUserId = null;
    this.showMemberModal.set(true);
  }

  saveAddMember() {
    const team = this.activeTeamForMember();
    if (!team || !this.memberToAddUserId) return;

    this.submitting.set(true);
    this.teamService.addMember(team.id, this.memberToAddUserId).subscribe({
      next: () => {
        this.submitting.set(false);
        this.showMemberModal.set(false);
        this.toast.success('Member added to team.');
        this.loadTeams();
      },
      error: (err) => {
        this.submitting.set(false);
        this.toast.error(err.error?.message || 'Failed to add member.');
      }
    });
  }

  removeMember(teamId: number, userId: number) {
    if (confirm('Remove this member from the team?')) {
      this.teamService.removeMember(teamId, userId).subscribe({
        next: () => {
          this.toast.success('Member removed.');
          this.loadTeams();
        },
        error: (err) => {
          this.toast.error(err.error?.message || 'Failed to remove member.');
        }
      });
    }
  }

  deleteTeam(id: number) {
    if (confirm('Are you sure you want to delete this team? All associated tasks will be unassigned.')) {
      this.teamService.deleteTeam(id).subscribe({
        next: () => {
          this.toast.success('Team deleted.');
          this.loadTeams();
        },
        error: (err) => {
          this.toast.error(err.error?.message || 'Failed to delete team.');
        }
      });
    }
  }
}
