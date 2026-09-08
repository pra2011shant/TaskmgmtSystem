import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LeaderboardUser } from '../models/time-tracking.model';

@Injectable({
  providedIn: 'root'
})
export class LeaderboardService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/leaderboard`;

  getLeaderboard(): Observable<LeaderboardUser[]> {
    return this.http.get<LeaderboardUser[]>(this.apiUrl);
  }
}
