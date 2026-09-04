/**
 * Organizational Team & Roster Management Service
 * 
 * Facilitates RESTful API operations for team provisioning, roster management,
 * and member assignments.
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateTeamRequest, Team } from '../models/team.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TeamService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/teams`;

  /**
   * Retrieves accessible teams based on user authorization context.
   */
  getTeams(): Observable<Team[]> {
    return this.http.get<Team[]>(this.apiUrl);
  }

  /**
   * Retrieves detailed specifications for a single team by ID.
   */
  getTeamById(id: number): Observable<Team> {
    return this.http.get<Team>(`${this.apiUrl}/${id}`);
  }

  /**
   * Provisions a new team entity (Admin and Manager roles only).
   */
  createTeam(payload: CreateTeamRequest): Observable<Team> {
    return this.http.post<Team>(this.apiUrl, payload);
  }

  /**
   * Modifies an existing team entity.
   */
  updateTeam(id: number, payload: CreateTeamRequest): Observable<Team> {
    return this.http.put<Team>(`${this.apiUrl}/${id}`, payload);
  }

  /**
   * Logically soft-deletes a team (Admin role only).
   */
  deleteTeam(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }

  /**
   * Enrolls a user as a member of a team.
   */
  addMember(teamId: number, userId: number): Observable<Team> {
    return this.http.post<Team>(`${this.apiUrl}/${teamId}/members`, { userId });
  }

  /**
   * Removes a member from a team.
   */
  removeMember(teamId: number, userId: number): Observable<Team> {
    return this.http.delete<Team>(`${this.apiUrl}/${teamId}/members/${userId}`);
  }
}
