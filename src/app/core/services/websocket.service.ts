import { Injectable, effect, signal } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { AuthService } from './auth.service';

export interface WebSocketMessage {
  event: string;
  doc_id?: number;
  status?: string;
  message?: string;
  [key: string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private socket$?: WebSocketSubject<any>;
  private readonly messagesSubject = new Subject<WebSocketMessage>();
  
  readonly messages$: Observable<WebSocketMessage> = this.messagesSubject.asObservable();
  readonly connected = signal<boolean>(false);

  constructor(private authService: AuthService) {
    // Monitor auth changes to connect/disconnect WS stream
    effect(() => {
      if (this.authService.isAuthenticated()) {
        this.connect();
      } else {
        this.disconnect();
      }
    });
  }

  private connect() {
    if (this.socket$) {
      return;
    }

    const token = this.authService.getToken();
    if (!token) return;

    const wsUrl = `ws://localhost:8000/api/v1/ws?token=${token}`;

    this.socket$ = webSocket({
      url: wsUrl,
      openObserver: {
        next: () => {
          console.log('[WebSocket] Connection established');
          this.connected.set(true);
        }
      },
      closeObserver: {
        next: () => {
          console.log('[WebSocket] Connection closed');
          this.connected.set(false);
          this.socket$ = undefined;
          // Attempt automatic reconnect after 5s if user remains authenticated
          if (this.authService.isAuthenticated()) {
            setTimeout(() => this.connect(), 5000);
          }
        }
      }
    });

    this.socket$.subscribe({
      next: (msg) => this.messagesSubject.next(msg),
      error: (err) => {
        console.error('[WebSocket] Error:', err);
        this.connected.set(false);
        this.socket$ = undefined;
      }
    });
  }

  private disconnect() {
    if (this.socket$) {
      this.socket$.complete();
      this.socket$ = undefined;
    }
  }

  sendMessage(msg: string) {
    if (this.socket$) {
      this.socket$.next(msg);
    }
  }
}
