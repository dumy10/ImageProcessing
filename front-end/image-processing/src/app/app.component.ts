import { Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterLink, RouterOutlet } from '@angular/router';
import { Observable } from 'rxjs';
import { ThemeMode, ThemeService } from './services/theme.service';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    MatButtonModule,
    MatToolbarModule,
    RouterLink,
    MatIconModule,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  title = 'image-processing';
  currentTheme$: Observable<ThemeMode>;

  constructor(private themeService: ThemeService) {
    this.currentTheme$ = this.themeService.getTheme$();
  }

  ngOnInit(): void {
    // The theme service will handle setting the initial theme

    // If we are running in production, we are removing the ng-version from the body tag
    if (environment.production) {
      const el = document.querySelector('app-root');
      if (el?.hasAttribute('ng-version')) {
        el.removeAttribute('ng-version');
      }
    }
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  isDarkTheme(): boolean {
    return this.themeService.getCurrentTheme() === ThemeMode.Dark;
  }
}
