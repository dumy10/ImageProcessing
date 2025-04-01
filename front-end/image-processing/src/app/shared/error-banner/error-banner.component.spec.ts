import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { By } from '@angular/platform-browser';
import { EMPTY } from 'rxjs';

import { HttpErrorResponse } from '@angular/common/http';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ErrorBannerComponent } from './error-banner.component';

describe('ErrorBannerComponent', () => {
  let component: ErrorBannerComponent;
  let fixture: ComponentFixture<ErrorBannerComponent>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;
  let snackBarRefSpy: jasmine.SpyObj<any>;

  beforeEach(async () => {
    // Create spies for MatSnackBar and its reference
    snackBarRefSpy = jasmine.createSpyObj('MatSnackBarRef', [
      'onAction',
      'dismiss',
    ]);
    snackBarRefSpy.onAction.and.returnValue(EMPTY);

    snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);
    snackBarSpy.open.and.returnValue(snackBarRefSpy);

    await TestBed.configureTestingModule({
      imports: [
        ErrorBannerComponent,
        MatButtonModule,
        MatIconModule,
        NoopAnimationsModule,
      ],
      providers: [{ provide: MatSnackBar, useValue: snackBarSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(ErrorBannerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not display banner when showBanner is false', () => {
    component.showBanner = false;
    fixture.detectChanges();

    const banner = fixture.debugElement.query(By.css('.error-banner'));
    expect(banner).toBeNull();
  });

  it('should display banner when showBanner is true', () => {
    component.showBanner = true;
    component.errorMessage = 'Test error message';
    fixture.detectChanges();

    const banner = fixture.debugElement.query(By.css('.error-banner'));
    expect(banner).not.toBeNull();

    const messageContent = banner.nativeElement.textContent;
    expect(messageContent).toContain('Test error message');
  });

  it('should show default message when errorMessage is empty', () => {
    component.showBanner = true;
    component.errorMessage = '';
    fixture.detectChanges();

    const banner = fixture.debugElement.query(By.css('.error-banner'));
    expect(banner.nativeElement.textContent).toContain('An error occurred');
  });

  it('should render action buttons when actions are provided', () => {
    component.showBanner = true;
    component.actions = [
      {
        label: 'Action 1',
        icon: 'refresh',
        action: jasmine.createSpy('action1'),
      },
      { label: 'Action 2', action: jasmine.createSpy('action2') },
    ];
    fixture.detectChanges();

    const actionButtons = fixture.debugElement.queryAll(
      By.css('.error-actions button')
    );
    // +1 for the dismiss button
    expect(actionButtons.length).toBe(3);

    // Check first action has icon
    const actionWithIcon = actionButtons[0].query(By.css('mat-icon'));
    expect(actionWithIcon).not.toBeNull();
    expect(actionWithIcon.nativeElement.textContent).toContain('refresh');

    // Check second action doesn't have icon
    const actionWithoutIcon = actionButtons[1].query(By.css('mat-icon'));
    expect(actionWithoutIcon).toBeNull();
  });

  it('should always display close button', () => {
    component.showBanner = true;
    component.actions = [];
    fixture.detectChanges();

    const closeButton = fixture.debugElement.query(
      By.css('.error-actions button')
    );
    expect(closeButton).not.toBeNull();
    expect(closeButton.nativeElement.textContent).toContain('close');
  });

  it('should emit dismiss event when close button is clicked', () => {
    component.showBanner = true;
    fixture.detectChanges();

    spyOn(component.dismiss, 'emit');
    const closeButton = fixture.debugElement.query(
      By.css('.error-actions button')
    );
    closeButton.nativeElement.click();

    expect(component.dismiss.emit).toHaveBeenCalled();
  });

  it('should call action function when action button is clicked', () => {
    const actionSpy = jasmine.createSpy('action1');
    component.showBanner = true;
    component.actions = [
      { label: 'Action 1', icon: 'refresh', action: actionSpy },
    ];
    fixture.detectChanges();

    const actionButton = fixture.debugElement.queryAll(
      By.css('.error-actions button')
    )[0];
    actionButton.nativeElement.click();

    expect(actionSpy).toHaveBeenCalled();
  });

  it('should not open snackbar when action array is empty', () => {
    component.showErrorWithActions('Error Title', 'Error Message', []);
    expect(snackBarSpy.open).not.toHaveBeenCalled();
  });

  it('should get readable error message from HTTP error response', () => {
    const httpError = new HttpErrorResponse({
      error: 'test error',
      status: 404,
      statusText: 'OK',
      url: 'http://test.com/api',
    });

    const message = component.getReadableErrorMessage(httpError);
    expect(message).toBe('Status: 404 Not Found');
  });

  it('should get readable error message for HTTP 400 error', () => {
    const httpError = new HttpErrorResponse({
      error: 'test error',
      status: 400,
      statusText: 'OK',
      url: 'http://test.com/api',
    });

    const message = component.getReadableErrorMessage(httpError);
    expect(message).toBe('Status: 400 Bad Request');
  });

  it('should get readable error message for HTTP 403 error', () => {
    const httpError = new HttpErrorResponse({
      error: 'test error',
      status: 403,
      statusText: 'OK',
      url: 'http://test.com/api',
    });

    const message = component.getReadableErrorMessage(httpError);
    expect(message).toBe('Status: 403 Forbidden');
  });

  it('should get readable error message for HTTP 500 error', () => {
    const httpError = new HttpErrorResponse({
      error: 'test error',
      status: 500,
      statusText: 'OK',
      url: 'http://test.com/api',
    });

    const message = component.getReadableErrorMessage(httpError);
    expect(message).toBe('Status: 500 Server Error');
  });

  it('should get readable error message for other HTTP errors', () => {
    const httpError = new HttpErrorResponse({
      error: 'test error',
      status: 418,
      statusText: 'OK',
      url: 'http://test.com/api',
    });

    const message = component.getReadableErrorMessage(httpError);
    expect(message).toBe('Status: 418 Error');
  });

  it('should handle non-HTTP errors with message', () => {
    const error = { message: 'Custom error message' };
    const message = component.getReadableErrorMessage(error);
    expect(message).toBe('Custom error message');
  });

  it('should handle errors without message', () => {
    const error = {};
    const message = component.getReadableErrorMessage(error);
    expect(message).toBe('An unknown error occurred');
  });
});
