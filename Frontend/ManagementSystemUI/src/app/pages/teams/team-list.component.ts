import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Team } from '../../core/models/team.model';
import { User } from '../../core/models/auth.model';
import { TeamService } from '../../core/services/team.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { SkeletonLoaderComponent } from '../../components/ui/skeleton-loader.component';
import { EmptyStateComponent } from '../../components/ui/empty-state.component';

@Component({
  selector: 'app-team-list',
  standalone: true,
  imports: [CommonModule, FormsModule, SkeletonLoaderComponent, EmptyStateComponent],
  templateUrl: './team-list.component.html',
  styleUrl: './team-list.component.css'
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
