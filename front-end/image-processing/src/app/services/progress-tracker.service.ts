import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ProgressUpdate {
  imageId: string;
  filter: string;
  progress: number;
}

@Injectable({
  providedIn: 'root',
})
export class ProgressTrackerService {
  private hubConnection: signalR.HubConnection | undefined;
  private progressSubject = new Subject<ProgressUpdate>();
  private isConnecting = false;
  private connectionPromise: Promise<void> | null = null;

  // Extract the base URL without the '/Images' part
  private readonly baseUrl = environment.apiUrl.replace('/Images', '');
  private readonly hubUrl = `${this.baseUrl}/progressHub`;
  private connectionEstablished = false;

  constructor() {}

  /**
   * Starts the connection to the SignalR hub.
   * Returns an Observable that emits when progress updates are received.
   */
  public startConnection(): Observable<ProgressUpdate> {
    if (!this.connectionEstablished && !this.isConnecting) {
      this.isConnecting = true;

      this.hubConnection = new signalR.HubConnectionBuilder()
        .withUrl(this.hubUrl)
        .withAutomaticReconnect()
        .configureLogging(signalR.LogLevel.None)
        .build();

      this.connectionPromise = this.hubConnection
        .start()
        .then(() => {
          console.log('Connection to progress hub established');
          this.connectionEstablished = true;
          this.isConnecting = false;
          this.registerOnProgressUpdate();
        })
        .catch((err) => {
          console.error(
            'Error while establishing connection to progress hub: ' + err
          );
          this.isConnecting = false;
          // Try to reconnect in 5 seconds
          setTimeout(() => this.startConnection(), 5000);
        });
    }

    return this.progressSubject.asObservable();
  }

  /**
   * Stops the hub connection when it's no longer needed
   */
  public stopConnection(): void {
    if (this.hubConnection) {
      this.hubConnection.stop().then(() => {
        console.log('Connection to progress hub stopped');
        this.connectionEstablished = false;
      });
    }
  }

  /**
   * Registers the callback for receiving progress updates from the server
   */
  private registerOnProgressUpdate(): void {
    if (this.hubConnection) {
      this.hubConnection.on(
        'ReceiveProgressUpdate',
        (imageId: string, filter: string, progress: number) => {
          console.debug(`Progress update: ${imageId}, ${filter}, ${progress}%`);
          this.progressSubject.next({ imageId, filter, progress });
        }
      );
    }
  }

  /**
   * Checks if the connection is established
   */
  public isConnected(): boolean {
    return this.connectionEstablished;
  }

  /**
   * Waits for the SignalR connection to be established
   * @param timeoutMs Maximum time to wait in milliseconds
   * @returns Promise that resolves to true if connected, false if timed out
   */
  public async waitForConnection(timeoutMs: number = 10000): Promise<boolean> {
    if (this.connectionEstablished) {
      return true;
    }

    if (!this.connectionPromise) {
      this.startConnection();
    }

    // Set a timeout
    const timeoutPromise = new Promise<boolean>((resolve) => {
      setTimeout(() => resolve(false), timeoutMs);
    });

    // Race between connection and timeout
    try {
      if (this.connectionPromise) {
        const result = await Promise.race([
          // The connection promise resolves to void, so we need to transform it
          this.connectionPromise.then(() => true).catch(() => false),
          timeoutPromise,
        ]);

        return result === true ? this.connectionEstablished : false;
      }
      return this.connectionEstablished;
    } catch (error) {
      console.error('Error waiting for connection:', error);
      return false;
    }
  }
}
