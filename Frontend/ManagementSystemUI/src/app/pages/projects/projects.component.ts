import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProjectService } from '../../core/services/project.service';
import { TeamService } from '../../core/services/team.service';
import { ToastService } from '../../core/services/toast.service';
import { Project, CreateProjectRequest, CreateMilestoneRequest } from '../../core/models/project.model';
import { Team } from '../../core/models/team.model';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './projects.component.html',
  styleUrl: './projects.component.css'
})
export class ProjectsComponent implements OnInit {
  private projectService = inject(ProjectService);
  private teamService = inject(TeamService);
  private toast = inject(ToastService);

  projects = signal<Project[]>([]);
  teams = signal<Team[]>([]);
  isLoading = signal<boolean>(true);
  selectedProject = signal<Project | null>(null);

  // Modals
  showCreateModal = signal<boolean>(false);
  showMilestoneModal = signal<boolean>(false);

  // Create Project Form State
  newProject: CreateProjectRequest = {
    projectKey: '',
    name: '',
    description: '',
    budget: undefined,
    startDate: '',
    endDate: '',
    teamId: undefined
  };

  // Create Milestone Form State
  newMilestone: CreateMilestoneRequest = {
    title: '',
    description: '',
    dueDate: ''
  };

  ngOnInit(): void {
    this.loadProjects();
    this.loadTeams();
  }

  loadProjects(): void {
    this.isLoading.set(true);
    this.projectService.getProjects().subscribe({
      next: (data) => {
        this.projects.set(data);
        if (data.length > 0 && !this.selectedProject()) {
          this.selectedProject.set(data[0]);
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.toast.error('Failed to load projects');
        this.isLoading.set(false);
      }
    });
  }

  loadTeams(): void {
    this.teamService.getTeams().subscribe({
      next: (data) => this.teams.set(data),
      error: () => {}
    });
  }

  selectProject(project: Project): void {
    this.selectedProject.set(project);
  }

  openCreateModal(): void {
    this.newProject = {
      projectKey: '',
      name: '',
      description: '',
      budget: undefined,
      startDate: '',
      endDate: '',
      teamId: this.teams().length > 0 ? this.teams()[0].id : undefined
    };
    this.showCreateModal.set(true);
  }

  closeCreateModal(): void {
    this.showCreateModal.set(false);
  }

  createProject(): void {
    if (!this.newProject.name.trim() || !this.newProject.projectKey.trim()) {
      this.toast.error('Please enter Project Name and Key');
      return;
    }

    this.projectService.createProject(this.newProject).subscribe({
      next: (created) => {
        this.toast.success('Project created successfully!');
        this.showCreateModal.set(false);
        this.loadProjects();
        this.selectedProject.set(created);
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Failed to create project');
      }
    });
  }

  openMilestoneModal(): void {
    this.newMilestone = {
      title: '',
      description: '',
      dueDate: ''
    };
    this.showMilestoneModal.set(true);
  }

  closeMilestoneModal(): void {
    this.showMilestoneModal.set(false);
  }

  createMilestone(): void {
    const current = this.selectedProject();
    if (!current) return;
    if (!this.newMilestone.title.trim()) {
      this.toast.error('Please enter Milestone Title');
      return;
    }

    this.projectService.addMilestone(current.id, this.newMilestone).subscribe({
      next: () => {
        this.toast.success('Milestone added successfully!');
        this.showMilestoneModal.set(false);
        this.loadProjects();
      },
      error: () => this.toast.error('Failed to add milestone')
    });
  }
}
