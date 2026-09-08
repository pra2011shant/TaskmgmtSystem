import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { User } from '../../core/models/auth.model';
import { AuthService } from '../../core/services/auth.service';
import { StatusBadgeComponent } from '../../components/ui/status-badge.component';
import { SkeletonLoaderComponent } from '../../components/ui/skeleton-loader.component';
import { EmptyStateComponent } from '../../components/ui/empty-state.component';

/**
 * Administrative User Management Directory
 * 
 * Displays enrolled corporate accounts and provides privileged audit columns
 * (Remarks, Record Status, Soft Delete flags, Creation timestamps) exclusively
 * for the Administrator role.
 */
@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    StatusBadgeComponent, 
    SkeletonLoaderComponent, 
    EmptyStateComponent
  ],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.css'
})
export class UserListComponent implements OnInit {
  authService = inject(AuthService);
  users = signal<User[]>([]);
  loading = signal(true);

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.loading.set(true);
    this.authService.getAllUsers().subscribe({
      next: (res) => {
        this.users.set(res);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  navigateToRegister() {
    window.location.href = '/register-user';
  }
}
