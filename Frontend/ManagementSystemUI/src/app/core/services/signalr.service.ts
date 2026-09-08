import { Injectable, signal, inject } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SignalRService {
  private authService = inject(AuthService);
  private hubConnection: signalR.HubConnection | null = null;

  public isConnected = signal<boolean>(false);
  
  // Real-time Event Subjects
  public taskCreated$ = new Subject<any>();
  public taskUpdated$ = new Subject<any>();
  public taskDeleted$ = new Subject<number>();
  public taskStatusChanged$ = new Subject<{ taskId: number; oldStatus: string; newStatus: string; updatedBy: string }>();
  public commentAdded$ = new Subject<{ taskId: number; comment: any }>();
  public timerEvent$ = new Subject<{ action: string; taskId: number; userId: number }>();

  public startConnection(): void {
    if (this.hubConnection && this.hubConnection.state === signalR.HubConnectionState.Connected) {
      return;
    }

    const hubUrl = environment.apiUrl.replace('/api', '') + '/hubs/tasks';

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => this.authService.token() || ''
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    this.hubConnection
      .start()
      .then(() => {
        this.isConnected.set(true);
        this.registerHandlers();
      })
      .catch((err) => {
        console.warn('SignalR Real-Time Hub Connection failed:', err);
        this.isConnected.set(false);
      });

    this.hubConnection.onclose(() => {
      this.isConnected.set(false);
    });

    this.hubConnection.onreconnected(() => {
      this.isConnected.set(true);
    });
  }

  public stopConnection(): void {
    if (this.hubConnection) {
      this.hubConnection.stop();
      this.isConnected.set(false);
    }
  }

  public joinTaskGroup(taskId: number): void {
    if (this.hubConnection && this.isConnected()) {
      this.hubConnection.invoke('JoinTaskGroup', taskId).catch(console.error);
    }
  }

  public leaveTaskGroup(taskId: number): void {
    if (this.hubConnection && this.isConnected()) {
      this.hubConnection.invoke('LeaveTaskGroup', taskId).catch(console.error);
    }
  }

  private registerHandlers(): void {
    if (!this.hubConnection) return;

    this.hubConnection.on('TaskCreated', (data) => {
      this.taskCreated$.next(data);
    });

    this.hubConnection.on('TaskUpdated', (data) => {
      this.taskUpdated$.next(data);
    });

    this.hubConnection.on('TaskDeleted', (taskId: number) => {
      this.taskDeleted$.next(taskId);
    });

    this.hubConnection.on('TaskStatusChanged', (taskId: number, oldStatus: string, newStatus: string, updatedBy: string) => {
      this.taskStatusChanged$.next({ taskId, oldStatus, newStatus, updatedBy });
    });

    this.hubConnection.on('CommentAdded', (taskId: number, comment: any) => {
      this.commentAdded$.next({ taskId, comment });
    });

    this.hubConnection.on('TimerEvent', (data) => {
      this.timerEvent$.next(data);
    });
  }
}
