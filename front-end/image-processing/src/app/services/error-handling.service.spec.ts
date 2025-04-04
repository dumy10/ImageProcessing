import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { MatSnackBar, MatSnackBarRef } from '@angular/material/snack-bar';
import { EMPTY } from 'rxjs';
import { ErrorAction } from '../shared/error-banner/error-banner.component';
import { ErrorHandlingService } from './error-handling.service';

describe('ErrorHandlingService', () => {
  let service: ErrorHandlingService;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;
  let snackBarRefSpy: jasmine.SpyObj<MatSnackBarRef<any>>;

  beforeEach(() => {
    // Create spy for MatSnackBar
    snackBarRefSpy = jasmine.createSpyObj('MatSnackBarRef', [
      'onAction',
      'dismiss',
    ]);
    snackBarRefSpy.onAction.and.returnValue(EMPTY); // Use EMPTY instead of of({})

    snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);
    snackBarSpy.open.and.returnValue(snackBarRefSpy);

    TestBed.configureTestingModule({
      providers: [
        ErrorHandlingService,
        { provide: MatSnackBar, useValue: snackBarSpy },
      ],
    });
    service = TestBed.inject(ErrorHandlingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should show error with retry action', () => {
    const retryAction = jasmine.createSpy('retryAction');

    service.showErrorWithRetry('Test Title', 'Test Message', retryAction);

    // Verify snackbar was opened with correct parameters
    expect(snackBarSpy.open).toHaveBeenCalledWith(
      'Test Title: Test Message',
      'Retry',
      jasmine.objectContaining({
        duration: 10000,
        panelClass: ['error-snackbar'],
      })
    );

    // Verify action is subscribed to
    expect(snackBarRefSpy.onAction).toHaveBeenCalled();
  });

  it('should show error with multiple actions', () => {
    const firstAction = jasmine.createSpy('firstAction');
    const actions: ErrorAction[] = [
      { label: 'Action 1', action: firstAction, icon: 'refresh' },
      { label: 'Action 2', action: jasmine.createSpy('secondAction') },
    ];

    service.showErrorWithActions('Test Title', 'Test Message', actions);

    // Verify snackbar was opened with correct parameters
    expect(snackBarSpy.open).toHaveBeenCalledWith(
      'Test Title: Test Message',
      'Action 1', // Should use first action label
      jasmine.objectContaining({
        duration: 10000,
        panelClass: ['error-snackbar'],
      })
    );

    // Verify action is subscribed to
    expect(snackBarRefSpy.onAction).toHaveBeenCalled();
  });

  it('should not open snackbar if actions array is empty', () => {
    service.showErrorWithActions('Test Title', 'Test Message', []);
    expect(snackBarSpy.open).not.toHaveBeenCalled();
  });

  it('should get readable error message from HTTP errors', () => {
    const httpError = new HttpErrorResponse({
      error: 'test error',
      status: 404,
      statusText: 'OK', // We fix this in our service
      url: 'http://test.com/api',
    });

    const message = service.getReadableErrorMessage(httpError);
    expect(message).toContain('Status: 404 Not Found');
  });

  it('should handle non-HTTP errors', () => {
    const error = { message: 'Custom error message' };
    const message = service.getReadableErrorMessage(error);
    expect(message).toBe('Custom error message');
  });

  it('should handle errors without message', () => {
    const error = {};
    const message = service.getReadableErrorMessage(error);
    expect(message).toBe('An unknown error occurred');
  });

  it('should return appropriate messages for different HTTP status codes', () => {
    // Test different error status codes
    const testCases = [
      { status: 400, context: 'test', expected: 'Invalid request for test' },
      {
        status: 401,
        context: '',
        expected: 'Authentication required. Please log in',
      },
      {
        status: 403,
        context: '',
        expected: 'You do not have permission to perform this action',
      },
      { status: 404, context: 'image', expected: 'image not found' },
      { status: 413, context: '', expected: 'Content is too large to process' },
      {
        status: 429,
        context: '',
        expected: 'Too many requests. Please try again later',
      },
      {
        status: 0,
        context: '',
        expected: 'Network error. Please check your connection',
      },
      {
        status: 500,
        context: 'filter',
        expected: 'Server error while processing filter',
      },
    ];

    testCases.forEach((testCase) => {
      const error = new HttpErrorResponse({
        status: testCase.status,
      });
      expect(service.getErrorMessageByStatus(error, testCase.context)).toBe(
        testCase.expected
      );
    });
  });
});
