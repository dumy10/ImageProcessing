import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { Location } from '@angular/common';
import {
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { AppComponent } from './app.component';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { routes } from './app.routes';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideRouter(routes),
        provideHttpClient(withInterceptorsFromDi()),
        provideAnimations(),
        {
          provide: ActivatedRoute,
          useValue: {
            params: of({}),
            snapshot: {
              paramMap: {
                get: () => null,
              },
            },
          },
        },
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have the 'image-processing' title`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('image-processing');
  });

  it('should render Home button with correct router link', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const homeButton = compiled.querySelector('button[routerLink=""]');
    expect(homeButton).toBeTruthy();
  });

  it('should render Gallery button with correct router link', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const galleryButton = compiled.querySelector(
      'button[routerLink="/gallery"]'
    );
    expect(galleryButton).toBeTruthy();
  });

  it('should navigate to Home route', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    const router = TestBed.inject(Router);
    const location = TestBed.inject(Location);

    await router.navigate(['']);
    fixture.detectChanges();
    expect(location.path()).toBe('');
  });

  it('should navigate to Gallery route', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    const router = TestBed.inject(Router);
    const location = TestBed.inject(Location);

    await router.navigate(['/gallery']);
    fixture.detectChanges();
    expect(location.path()).toBe('/gallery');
  });
});
