import { Component, EventEmitter, HostListener, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SearchService } from '../../core/services/search.service';
import { GlobalSearchResult } from '../../core/models/search.model';

@Component({
  selector: 'app-global-search-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './global-search-modal.component.html',
  styleUrl: './global-search-modal.component.css'
})
export class GlobalSearchModalComponent {
  private searchService = inject(SearchService);
  private router = inject(Router);

  @Output() close = new EventEmitter<void>();

  searchQuery = signal<string>('');
  results = signal<GlobalSearchResult[]>([]);
  isLoading = signal<boolean>(false);

  @HostListener('window:keydown.escape')
  handleEscape(): void {
    this.close.emit();
  }

  onSearch(query: string): void {
    this.searchQuery.set(query);
    if (!query || query.trim().length < 2) {
      this.results.set([]);
      return;
    }

    this.isLoading.set(true);
    this.searchService.search(query).subscribe({
      next: (res) => {
        this.results.set(res);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  navigate(result: GlobalSearchResult): void {
    this.close.emit();
    this.router.navigateByUrl(result.url);
  }
}
