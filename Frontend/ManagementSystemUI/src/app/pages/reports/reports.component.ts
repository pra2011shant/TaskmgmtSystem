import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReportService } from '../../core/services/report.service';
import { TeamProductivity, UserProductivity } from '../../core/models/report.model';
import { TaskItem } from '../../core/models/task.model';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.css'
})
export class ReportsComponent implements OnInit {
  private reportService = inject(ReportService);
  private toast = inject(ToastService);

  activeTab = signal<'user' | 'team' | 'overdue'>('user');
  isLoading = signal<boolean>(true);

  userReports = signal<UserProductivity[]>([]);
  teamReports = signal<TeamProductivity[]>([]);
  overdueTasks = signal<TaskItem[]>([]);

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);
    if (this.activeTab() === 'user') {
      this.reportService.getUserProductivity().subscribe({
        next: (data) => {
          this.userReports.set(data);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false)
      });
    } else if (this.activeTab() === 'team') {
      this.reportService.getTeamProductivity().subscribe({
        next: (data) => {
          this.teamReports.set(data);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false)
      });
    } else {
      this.reportService.getOverdueTasks().subscribe({
        next: (data) => {
          this.overdueTasks.set(data);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false)
      });
    }
  }

  setTab(tab: 'user' | 'team' | 'overdue'): void {
    this.activeTab.set(tab);
    this.loadData();
  }

  exportCsv(): void {
    this.reportService.exportCsv().subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `WorkFlowPro_Tasks_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.toast.success('CSV Report exported successfully.');
      },
      error: () => this.toast.error('Failed to export CSV report.')
    });
  }

  exportHtml(): void {
    const type = this.activeTab() === 'team' ? 'team' : 'user';
    this.reportService.exportHtml(type).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `WorkFlowPro_${type}_report_${new Date().toISOString().split('T')[0]}.html`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.toast.success('Printable Report exported successfully.');
      },
      error: () => this.toast.error('Failed to export printable report.')
    });
  }
}
