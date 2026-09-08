import { Injectable, signal, effect } from '@angular/core';

export type Theme = 'dark' | 'light';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly THEME_KEY = 'workflow_pro_theme';
  public currentTheme = signal<Theme>(this.getInitialTheme());

  constructor() {
    this.applyTheme(this.currentTheme());

    // Sync theme on change
    effect(() => {
      const theme = this.currentTheme();
      this.applyTheme(theme);
      localStorage.setItem(this.THEME_KEY, theme);
    });
  }

  public toggleTheme(): void {
    this.currentTheme.update(t => t === 'dark' ? 'light' : 'dark');
  }

  public setTheme(theme: Theme): void {
    this.currentTheme.set(theme);
  }

  private getInitialTheme(): Theme {
    const saved = localStorage.getItem(this.THEME_KEY) as Theme | null;
    if (saved === 'dark' || saved === 'light') return saved;

    // Detect system preference
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
    return 'dark'; // Default premium dark
  }

  private applyTheme(theme: Theme): void {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('light-theme');
      root.classList.remove('dark-theme');
      root.setAttribute('data-theme', 'light');
    } else {
      root.classList.add('dark-theme');
      root.classList.remove('light-theme');
      root.setAttribute('data-theme', 'dark');
    }
  }
}
