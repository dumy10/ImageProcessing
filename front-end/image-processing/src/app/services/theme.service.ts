import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export enum ThemeMode {
  Light = 'light-theme',
  Dark = 'dark-theme',
}

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private themeSubject: BehaviorSubject<ThemeMode>;
  private readonly THEME_KEY = 'preferred-theme';
  private mediaQuery: MediaQueryList;

  constructor() {
    // Check if user has a stored preference
    const storedTheme = localStorage.getItem(this.THEME_KEY) as ThemeMode;

    // Check if user prefers dark mode
    this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const prefersDarkMode = this.mediaQuery.matches;

    // Set initial theme based on stored preference or system preference
    const initialTheme =
      storedTheme || (prefersDarkMode ? ThemeMode.Dark : ThemeMode.Light);

    this.themeSubject = new BehaviorSubject<ThemeMode>(initialTheme);
    this.setTheme(initialTheme);

    // Listen for changes to the prefers-color-scheme media query
    this.mediaQuery.addEventListener('change', (e) => {
      // Only update theme automatically if user hasn't explicitly set a preference
      if (!localStorage.getItem(this.THEME_KEY)) {
        const newTheme = e.matches ? ThemeMode.Dark : ThemeMode.Light;
        this.setTheme(newTheme);
      }
    });
  }

  public getCurrentTheme(): ThemeMode {
    return this.themeSubject.value;
  }

  public getTheme$(): Observable<ThemeMode> {
    return this.themeSubject.asObservable();
  }

  public toggleTheme(): void {
    const newTheme =
      this.getCurrentTheme() === ThemeMode.Light
        ? ThemeMode.Dark
        : ThemeMode.Light;
    this.setTheme(newTheme);
  }

  public setTheme(theme: ThemeMode): void {
    // Save to localStorage
    localStorage.setItem(this.THEME_KEY, theme);
    this.themeSubject.next(theme);

    // Apply theme to document body
    document.body.classList.remove(ThemeMode.Light, ThemeMode.Dark);
    document.body.classList.add(theme);
  }

  // Method to reset to system preference
  public resetToSystemPreference(): void {
    localStorage.removeItem(this.THEME_KEY);
    const systemPreference = this.mediaQuery.matches
      ? ThemeMode.Dark
      : ThemeMode.Light;
    this.setTheme(systemPreference);
  }
}
