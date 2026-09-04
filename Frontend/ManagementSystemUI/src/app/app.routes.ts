/**
 * Application Routing Architecture
 * 
 * Configures role-guarded routes, layout outlets, and feature modules:
 * - Public: /login, /register
 * - Protected: /dashboard, /tasks, /schedule, /teams, /notifications
 * - Administrative: /users (Admin role required)
 */

import { Routes } from '@angular/router';
import { LoginComponent } from './pages/auth/login.component';
import { RegisterComponent } from './pages/auth/register.component';
import { LayoutComponent } from './components/layout/layout.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { TaskListComponent } from './pages/tasks/task-list.component';
import { TaskScheduleComponent } from './pages/schedule/task-schedule.component';
import { TeamListComponent } from './pages/teams/team-list.component';
import { NotificationsPageComponent } from './pages/notifications/notifications-page.component';
import { UserListComponent } from './pages/users/user-list.component';
import { authGuard, roleGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // Public Authentication Routes
  { path: 'login', component: LoginComponent },
  { path: 'register', redirectTo: 'register-user', pathMatch: 'full' },

  // Protected Application Shell
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'tasks', component: TaskListComponent },
      { path: 'schedule', component: TaskScheduleComponent },
      { path: 'teams', component: TeamListComponent },
      { path: 'notifications', component: NotificationsPageComponent },
      
      // Administrative Tools (Admin role required)
      { 
        path: 'users', 
        component: UserListComponent, 
        canActivate: [roleGuard(['Admin'])] 
      },
      { 
        path: 'register-user', 
        component: RegisterComponent, 
        canActivate: [roleGuard(['Admin'])] 
      }
    ]
  },

  // Catch-All Redirect
  { path: '**', redirectTo: 'dashboard' }
];
