import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { GlobalSearchResult } from '../models/search.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/search`;

  search(query: string): Observable<GlobalSearchResult[]> {
    return this.http.get<GlobalSearchResult[]>(`${this.apiUrl}?q=${encodeURIComponent(query)}`);
  }
}
