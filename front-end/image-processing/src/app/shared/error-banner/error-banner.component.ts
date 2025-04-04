import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

export interface ErrorAction {
  label: string;
  icon?: string;
  action: () => void;
}

@Component({
  selector: 'app-error-banner',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatSnackBarModule],
  templateUrl: './error-banner.component.html',
  styleUrl: './error-banner.component.scss',
})
export class ErrorBannerComponent {
  @Input() errorMessage = '';
  @Input() showBanner = false;
  @Input() actions: ErrorAction[] = [];
  @Output() dismiss = new EventEmitter<void>();

  constructor(private snackBar: MatSnackBar) {}

  onDismiss(): void {
    this.dismiss.emit();
  }

  /**
   * Shows an error snackbar with a primary action
   */
  showErrorWithRetry(
    title: string,
    message: string,
    retryAction: () => void
  ): void {
    const snackBarRef = this.snackBar.open(`${title}: ${message}`, 'Retry', {
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
   * Helper function to extract a readable error message
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
}
