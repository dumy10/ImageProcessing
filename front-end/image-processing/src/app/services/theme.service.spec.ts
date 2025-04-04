import { TestBed } from '@angular/core/testing';
import { ThemeService, ThemeMode } from './theme.service';

describe('ThemeService', () => {
  let service: ThemeService;
  let localStorageSpy: jasmine.SpyObj<Storage>;
  let originalLocalStorage: Storage;
  let mediaQueryListMock: any;

  beforeEach(() => {
    // Save reference to original localStorage
    originalLocalStorage = window.localStorage;

    // Create localStorage spy
    localStorageSpy = jasmine.createSpyObj('localStorage', [
      'getItem',
      'setItem',
      'removeItem',
    ]);

    // Create MediaQueryList mock
    mediaQueryListMock = {
      matches: false,
      addEventListener: jasmine.createSpy('addEventListener'),
      removeEventListener: jasmine.createSpy('removeEventListener'),
    };

    // Mock window.matchMedia
    spyOn(window, 'matchMedia').and.returnValue(mediaQueryListMock);

    // Mock localStorage
    Object.defineProperty(window, 'localStorage', { value: localStorageSpy });

    TestBed.configureTestingModule({
      providers: [ThemeService],
    });
  });

  afterEach(() => {
    // Restore original localStorage
    Object.defineProperty(window, 'localStorage', {
      value: originalLocalStorage,
    });
  });

  it('should be created', () => {
    localStorageSpy.getItem.and.returnValue(null);
    service = TestBed.inject(ThemeService);
    expect(service).toBeTruthy();
  });

  it('should initialize with stored theme when available', () => {
    localStorageSpy.getItem.and.returnValue(ThemeMode.Dark);
    service = TestBed.inject(ThemeService);

    expect(localStorageSpy.getItem).toHaveBeenCalledWith('preferred-theme');
    expect(service.getCurrentTheme()).toBe(ThemeMode.Dark);
  });

  it('should initialize with system preference when no stored theme', () => {
    localStorageSpy.getItem.and.returnValue(null);

    // Test for light mode preference
    mediaQueryListMock.matches = false;
    service = TestBed.inject(ThemeService);
    expect(service.getCurrentTheme()).toBe(ThemeMode.Light);

    // Reset for dark mode test
    TestBed.resetTestingModule();

    // Setup for dark mode preference test
    localStorageSpy = jasmine.createSpyObj('localStorage', [
      'getItem',
      'setItem',
      'removeItem',
    ]);
    Object.defineProperty(window, 'localStorage', { value: localStorageSpy });
    localStorageSpy.getItem.and.returnValue(null);
    mediaQueryListMock.matches = true;

    service = TestBed.inject(ThemeService);
    expect(service.getCurrentTheme()).toBe(ThemeMode.Dark);
  });

  it('should toggle theme correctly', () => {
    localStorageSpy.getItem.and.returnValue(ThemeMode.Light);
    service = TestBed.inject(ThemeService);

    // Spy on document body classList manipulation
    spyOn(document.body.classList, 'add');
    spyOn(document.body.classList, 'remove');

    // Test toggling from light to dark
    service.toggleTheme();
    expect(localStorageSpy.setItem).toHaveBeenCalledWith(
      'preferred-theme',
      ThemeMode.Dark
    );
    expect(service.getCurrentTheme()).toBe(ThemeMode.Dark);
    expect(document.body.classList.remove).toHaveBeenCalledWith(
      ThemeMode.Light,
      ThemeMode.Dark
    );
    expect(document.body.classList.add).toHaveBeenCalledWith(ThemeMode.Dark);

    // Test toggling from dark to light
    service.toggleTheme();
    expect(localStorageSpy.setItem).toHaveBeenCalledWith(
      'preferred-theme',
      ThemeMode.Light
    );
    expect(service.getCurrentTheme()).toBe(ThemeMode.Light);
    expect(document.body.classList.remove).toHaveBeenCalledWith(
      ThemeMode.Light,
      ThemeMode.Dark
    );
    expect(document.body.classList.add).toHaveBeenCalledWith(ThemeMode.Light);
  });

  it('should set theme correctly', () => {
    localStorageSpy.getItem.and.returnValue(null);
    service = TestBed.inject(ThemeService);

    // Spy on document body classList manipulation
    spyOn(document.body.classList, 'add');
    spyOn(document.body.classList, 'remove');

    service.setTheme(ThemeMode.Dark);
    expect(localStorageSpy.setItem).toHaveBeenCalledWith(
      'preferred-theme',
      ThemeMode.Dark
    );
    expect(service.getCurrentTheme()).toBe(ThemeMode.Dark);
    expect(document.body.classList.remove).toHaveBeenCalledWith(
      ThemeMode.Light,
      ThemeMode.Dark
    );
    expect(document.body.classList.add).toHaveBeenCalledWith(ThemeMode.Dark);
  });

  it('should provide theme as observable', (done) => {
    localStorageSpy.getItem.and.returnValue(ThemeMode.Light);
    service = TestBed.inject(ThemeService);

    service.getTheme$().subscribe((theme) => {
      expect(theme).toBe(ThemeMode.Light);
      done();
    });
  });

  it('should reset to system preference', () => {
    localStorageSpy.getItem.and.returnValue(ThemeMode.Dark);
    mediaQueryListMock.matches = false; // System prefers light
    service = TestBed.inject(ThemeService);

    // Spy on document body classList manipulation
    spyOn(document.body.classList, 'add');
    spyOn(document.body.classList, 'remove');

    service.resetToSystemPreference();

    expect(localStorageSpy.removeItem).toHaveBeenCalledWith('preferred-theme');
    expect(service.getCurrentTheme()).toBe(ThemeMode.Light);
    expect(document.body.classList.remove).toHaveBeenCalledWith(
      ThemeMode.Light,
      ThemeMode.Dark
    );
    expect(document.body.classList.add).toHaveBeenCalledWith(ThemeMode.Light);
  });

  it('should respond to system preference changes when no stored preference', () => {
    localStorageSpy.getItem.and.returnValue(null);
    mediaQueryListMock.matches = false; // Start with light mode

    service = TestBed.inject(ThemeService);

    // Capture the event listener callback
    const eventListenerCallback =
      mediaQueryListMock.addEventListener.calls.argsFor(0)[1];

    // Spy on document body classList manipulation
    spyOn(document.body.classList, 'add');
    spyOn(document.body.classList, 'remove');

    // Simulate change to dark mode
    eventListenerCallback({ matches: true });

    expect(service.getCurrentTheme()).toBe(ThemeMode.Dark);
    expect(document.body.classList.remove).toHaveBeenCalledWith(
      ThemeMode.Light,
      ThemeMode.Dark
    );
    expect(document.body.classList.add).toHaveBeenCalledWith(ThemeMode.Dark);
  });

  it('should not respond to system preference changes when there is a stored preference', () => {
    localStorageSpy.getItem.and.returnValue(ThemeMode.Light); // Stored preference
    mediaQueryListMock.matches = true; // System prefers dark

    service = TestBed.inject(ThemeService);

    // Capture the event listener callback
    const eventListenerCallback =
      mediaQueryListMock.addEventListener.calls.argsFor(0)[1];

    // Spy on setTheme
    spyOn(service, 'setTheme');

    // Simulate change to system preference
    eventListenerCallback({ matches: false });

    // Should not change theme because there's a stored preference
    expect(service.setTheme).not.toHaveBeenCalled();
  });
});
