import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../core/services/admin.service';
import { AuditService } from '../../core/services/audit.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { PermissionsMatrixResponse, SystemStats } from '../../core/models/admin.model';
import { AuditLog } from '../../core/models/audit.model';
import { User } from '../../core/models/auth.model';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-panel.component.html',
  styleUrl: './admin-panel.component.css'
})
export class AdminPanelComponent implements OnInit {
  private adminService = inject(AdminService);
  private auditService = inject(AuditService);
  private authService = inject(AuthService);
  private toast = inject(ToastService);

  activeTab = signal<'permissions' | 'audit' | 'stats'>('permissions');
  isLoading = signal<boolean>(true);

  permissionsMatrix = signal<PermissionsMatrixResponse | null>(null);
  selectedRole = signal<number>(2); // 2 = Manager, 3 = User
  selectedRolePermissions = signal<string[]>([]);

  auditLogs = signal<AuditLog[]>([]);
  auditFilterEntity = signal<string>('');
  selectedAuditLog = signal<AuditLog | null>(null);

  systemStats = signal<SystemStats | null>(null);

  ngOnInit(): void {
    this.loadTab();
  }

  loadTab(): void {
    this.isLoading.set(true);
    if (this.activeTab() === 'permissions') {
      this.adminService.getPermissionsMatrix().subscribe({
        next: (data) => {
          this.permissionsMatrix.set(data);
          this.updateSelectedRolePermissions();
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false)
      });
    } else if (this.activeTab() === 'audit') {
      this.auditService.getLogs(this.auditFilterEntity() || undefined).subscribe({
        next: (logs) => {
          this.auditLogs.set(logs);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false)
      });
    } else {
      this.adminService.getSystemStats().subscribe({
        next: (stats) => {
          this.systemStats.set(stats);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false)
      });
    }
  }

  setTab(tab: 'permissions' | 'audit' | 'stats'): void {
    this.activeTab.set(tab);
    this.loadTab();
  }

  onRoleChange(roleNum: number): void {
    this.selectedRole.set(roleNum);
    this.updateSelectedRolePermissions();
  }

  updateSelectedRolePermissions(): void {
    const matrix = this.permissionsMatrix();
    if (!matrix) return;
    const roleKey = this.selectedRole() === 2 ? 'Manager' : 'User';
    this.selectedRolePermissions.set(matrix.rolePermissions[roleKey] || []);
  }

  isPermissionChecked(permission: string): boolean {
    return this.selectedRolePermissions().includes(permission);
  }

  togglePermission(permission: string): void {
    const current = [...this.selectedRolePermissions()];
    const index = current.indexOf(permission);
    if (index > -1) {
      current.splice(index, 1);
    } else {
      current.push(permission);
    }
    this.selectedRolePermissions.set(current);
  }

  savePermissions(): void {
    this.adminService.updateRolePermissions(this.selectedRole(), this.selectedRolePermissions()).subscribe({
      next: (res) => {
        this.toast.success(res.message);
        this.loadTab();
      },
      error: () => this.toast.error('Failed to update role permissions.')
    });
  }

  viewAuditDetails(log: AuditLog): void {
    this.selectedAuditLog.set(log);
  }
}
