import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../core/services/admin.service';
import { AuditService } from '../../core/services/audit.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { PermissionsMatrixResponse, SystemStats } from '../../core/models/admin.model';
import { AuditLog, SystemActivityStats, UserPresence, FieldDiff } from '../../core/models/audit.model';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-panel.component.html',
  styleUrl: './admin-panel.component.css'
})
export class AdminPanelComponent implements OnInit, OnDestroy {
  private adminService = inject(AdminService);
  private auditService = inject(AuditService);
  public authService = inject(AuthService);
  private toast = inject(ToastService);

  activeTab = signal<'presence' | 'audit' | 'permissions' | 'stats'>('presence');
  isLoading = signal<boolean>(true);
  isRefreshing = signal<boolean>(false);

  // KPI Activity Stats
  activityStats = signal<SystemActivityStats>({
    activeUsers: 0,
    todayLogins: 0,
    tasksUpdatedToday: 0,
    deletionsToday: 0,
    totalAuditLogs: 0
  });

  // User Presence Tracking
  userPresenceList = signal<UserPresence[]>([]);
  presenceSearch = signal<string>('');
  presenceRoleFilter = signal<string>('ALL');

  filteredPresenceList = computed(() => {
    const list = this.userPresenceList();
    const query = this.presenceSearch().toLowerCase().trim();
    const role = this.presenceRoleFilter();

    return list.filter(u => {
      const matchSearch = !query || 
        u.fullName.toLowerCase().includes(query) || 
        u.email.toLowerCase().includes(query) || 
        (u.department && u.department.toLowerCase().includes(query)) ||
        (u.lastIpAddress && u.lastIpAddress.includes(query));
      
      const matchRole = role === 'ALL' || u.role.toUpperCase() === role.toUpperCase();
      return matchSearch && matchRole;
    });
  });

  // Security Audit Trail
  auditLogs = signal<AuditLog[]>([]);
  auditSearch = signal<string>('');
  auditActionFilter = signal<string>('ALL');
  auditModuleFilter = signal<string>('ALL');
  selectedAuditLog = signal<AuditLog | null>(null);

  // Field Diffs
  parsedFieldDiffs = computed<FieldDiff[]>(() => {
    const log = this.selectedAuditLog();
    if (!log) return [];

    let oldObj: Record<string, any> = {};
    let newObj: Record<string, any> = {};

    try {
      if (log.oldValueJson) oldObj = JSON.parse(log.oldValueJson);
    } catch {
      oldObj = { raw: log.oldValueJson };
    }

    try {
      if (log.newValueJson) newObj = JSON.parse(log.newValueJson);
    } catch {
      newObj = { raw: log.newValueJson };
    }

    const allKeys = Array.from(new Set([...Object.keys(oldObj), ...Object.keys(newObj)]));
    return allKeys.map(key => {
      const oldVal = oldObj[key] !== undefined ? oldObj[key] : '—';
      const newVal = newObj[key] !== undefined ? newObj[key] : '—';
      const isModified = JSON.stringify(oldVal) !== JSON.stringify(newVal);
      return {
        fieldName: key,
        oldValue: typeof oldVal === 'object' && oldVal !== null ? JSON.stringify(oldVal) : String(oldVal),
        newValue: typeof newVal === 'object' && newVal !== null ? JSON.stringify(newVal) : String(newVal),
        isModified
      };
    });
  });

  // Permissions Matrix
  permissionsMatrix = signal<PermissionsMatrixResponse | null>(null);
  selectedRole = signal<number>(2); // 2 = Manager, 3 = User
  selectedRolePermissions = signal<string[]>([]);

  // Telemetry
  systemStats = signal<SystemStats | null>(null);

  private refreshTimer: any;

  ngOnInit(): void {
    this.loadAllMetrics();
    this.loadTab();

    // Auto-refresh presence every 30s
    this.refreshTimer = setInterval(() => {
      if (this.activeTab() === 'presence') {
        this.loadPresenceData(false);
      }
    }, 30000);
  }

  ngOnDestroy(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
  }

  loadAllMetrics(): void {
    this.auditService.getStats().subscribe({
      next: (stats) => this.activityStats.set(stats),
      error: () => {}
    });
  }

  loadTab(): void {
    this.isLoading.set(true);

    if (this.activeTab() === 'presence') {
      this.loadPresenceData(true);
    } else if (this.activeTab() === 'audit') {
      this.loadAuditLogs();
    } else if (this.activeTab() === 'permissions') {
      this.adminService.getPermissionsMatrix().subscribe({
        next: (data) => {
          this.permissionsMatrix.set(data);
          this.updateSelectedRolePermissions();
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

  loadPresenceData(showLoader: boolean = true): void {
    if (showLoader) this.isLoading.set(true);
    this.isRefreshing.set(true);

    this.auditService.getPresence().subscribe({
      next: (presence) => {
        this.userPresenceList.set(presence);
        this.loadAllMetrics();
        this.isLoading.set(false);
        this.isRefreshing.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.isRefreshing.set(false);
      }
    });
  }

  loadAuditLogs(): void {
    this.isLoading.set(true);
    const filter: any = {
      search: this.auditSearch() || undefined,
      action: this.auditActionFilter() !== 'ALL' ? this.auditActionFilter() : undefined,
      module: this.auditModuleFilter() !== 'ALL' ? this.auditModuleFilter() : undefined,
      limit: 150
    };

    this.auditService.getLogs(filter).subscribe({
      next: (logs) => {
        this.auditLogs.set(logs);
        this.loadAllMetrics();
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  setTab(tab: 'presence' | 'audit' | 'permissions' | 'stats'): void {
    this.activeTab.set(tab);
    this.loadTab();
  }

  refreshCurrentTab(): void {
    this.loadAllMetrics();
    this.loadTab();
    this.toast.info('System activity & telemetry refreshed.');
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

  getActionBadgeClass(action: string): string {
    const act = action.toUpperCase();
    if (act === 'LOGIN') return 'badge-login';
    if (act === 'LOGOUT') return 'badge-logout';
    if (act === 'CREATE') return 'badge-create';
    if (act === 'UPDATE' || act === 'STATUS_CHANGE') return 'badge-update';
    if (act === 'DELETE') return 'badge-delete';
    return 'badge-info';
  }
}

