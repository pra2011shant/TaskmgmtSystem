import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LeaderboardService } from '../../core/services/leaderboard.service';
import { LeaderboardUser } from '../../core/models/time-tracking.model';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './leaderboard.component.html',
  styleUrl: './leaderboard.component.css'
})
export class LeaderboardComponent implements OnInit {
  private leaderboardService = inject(LeaderboardService);
  private toast = inject(ToastService);

  leaderboard = signal<LeaderboardUser[]>([]);
  isLoading = signal<boolean>(true);

  ngOnInit(): void {
    this.loadLeaderboard();
  }

  loadLeaderboard(): void {
    this.isLoading.set(true);
    this.leaderboardService.getLeaderboard().subscribe({
      next: (data) => {
        this.leaderboard.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.toast.error('Failed to load leaderboard rankings');
        this.isLoading.set(false);
      }
    });
  }

  getRankBadgeClass(rank: number): string {
    if (rank === 1) return 'rank-gold';
    if (rank === 2) return 'rank-silver';
    if (rank === 3) return 'rank-bronze';
    return 'rank-default';
  }
}
