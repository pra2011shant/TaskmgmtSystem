import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from './sidebar.component';
import { NavbarComponent } from './navbar.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent, NavbarComponent],
  template: `
    <div class="app-container">
      <app-sidebar></app-sidebar>
      <div class="main-content">
        <app-navbar></app-navbar>
        <main class="page-body">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `
})
export class LayoutComponent {}
