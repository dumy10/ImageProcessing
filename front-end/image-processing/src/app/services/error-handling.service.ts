import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ErrorAction } from '../shared/error-banner/error-banner.component';

@Injectable({
  providedIn: 'root',
})
export class ErrorHandlingService {
  constructor(private snackBar: MatSnackBar) {}

  /**
   * Shows an error snackbar with a primary action
   */
  showErrorWithRetry(
    title: string,
    message: string,
    retryAction: () => void,
    buttonLabel: string = 'Retry'
  ): void {
    const snackBarRef = this.snackBar.open(`${title}: ${message}`, buttonLabel, {
      duration: 10000,
      panelClass: ['error-snackbar'],
    });

    snackBarRef.onAction().subscribe(() => {
      retryAction();
    });
  }

  /**
   * Shows an error snackbar with multiple actions (uses the first action as main action)
   */
  showErrorWithActions(
    title: string,
    message: string,
    actions: ErrorAction[]
  ): void {
    if (!actions || actions.length === 0) {
      return;
    }

    const mainAction = actions[0]; // Use first action as main action

    const snackBarRef = this.snackBar.open(
      `${title}: ${message}`,
      mainAction.label,
      {
        duration: 10000,
        panelClass: ['error-snackbar'],
      }
    );

    snackBarRef.onAction().subscribe(() => {
      mainAction.action();
    });
  }

  /**
   * Helper function to extract a readable error message from HTTP errors
   */
  getReadableErrorMessage(error: any): string {
    // Don't show the full URL in error messages
    if (error.message && error.message.includes('Http failure response for')) {
      const statusCode = error.status;
      let statusText = error.statusText;

      // Fix incorrect "OK" message for errors
      if (statusCode >= 400 && statusText === 'OK') {
        switch (statusCode) {
          case 404:
            statusText = 'Not Found';
            break;
          case 400:
            statusText = 'Bad Request';
            break;
          case 403:
            statusText = 'Forbidden';
            break;
          case 500:
            statusText = 'Server Error';
            break;
          default:
            statusText = 'Error';
        }
      }

      return `Status: ${statusCode} ${statusText}`;
    }

    return error.message || 'An unknown error occurred';
  }

  /**
   * Get error message based on HTTP status code for common error scenarios
   */
  getErrorMessageByStatus(
    error: HttpErrorResponse,
    context: string = ''
  ): string {
    switch (error.status) {
      case 400:
        return `Invalid request${context ? ' for ' + context : ''}`;
      case 401:
        return 'Authentication required. Please log in';
      case 403:
        return 'You do not have permission to perform this action';
      case 404:
        return `${context || 'Resource'} not found`;
      case 413:
        return 'Content is too large to process';
      case 429:
        return 'Too many requests. Please try again later';
      case 0:
        return 'Network error. Please check your connection';
      case 500:
      default:
        return `Server error${context ? ' while processing ' + context : ''}`;
    }
  }
}
