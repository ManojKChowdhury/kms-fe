import { Injectable, OnDestroy, EnvironmentInjector, inject, signal } from '@angular/core';
import { Subject, Observable, Subscription } from 'rxjs';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { AuthService } from './auth.service';
import { ENVIRONMENT_TOKEN } from './auth.service';

export interface WebSocketMessage {
  event: string;
  doc_id?: number;
  status?: string;
  message?: string;
}

const BASE_RECONNECT_DELAY_MS = 1000;
const MAX_RECONNECT_DELAY_MS = 30000;

@Injectable({ providedIn: 'root' })
export class WebSocketService implements OnDestroy {
  private socket$?: WebSocketSubject<WebSocketMessage>;
  private readonly messagesSubject = new Subject<WebSocketMessage>();
  private reconnectTimer?: ReturnType<typeof setTimeout>;
  private reconnectAttempts = 0;

  /** Subscription to auth state; kept for teardown completeness. */
  private authSub?: Subscription;

  readonly messages$: Observable<WebSocketMessage> = this.messagesSubject.asObservable();
  readonly connected = signal(false);
  private env: { apiUrl: string; wsUrl: string };

  constructor(private authService: AuthService) {
    const injector = inject(EnvironmentInjector);
    const env = injector.get(ENVIRONMENT_TOKEN);
    this.env = env;

    // Explicit subscription (instead of an effect) ties the socket lifecycle to
    // auth changes. This is a root singleton, so it lives for the app lifetime.
    this.authSub = this.authService.isAuthenticated$.subscribe((isAuthenticated: boolean) => {
      if (isAuthenticated) {
        this.connect();
      } else {
        this.disconnect();
      }
    });
  }

  ngOnDestroy(): void {
    this.authSub?.unsubscribe();
    this.clearReconnectTimer();
    this.disconnect();
  }

  sendMessage(msg: string): void {
    this.socket$?.next(msg as unknown as WebSocketMessage);
  }

  private connect() {
    if (this.socket$ || !this.authService.isAuthenticated()) {
      return;
    }

    const token = this.authService.getToken();
    if (!token) return;

    // NOTE: token travels in the query string; server/proxy access logs may capture it.
    const wsUrl = this.env?.wsUrl ?? 'ws://localhost:8000/api/v1/ws';

    this.socket$ = webSocket<WebSocketMessage>({
      url: wsUrl,
      openObserver: {
        next: () => {
          console.log('[WebSocket] Connection established');
          this.reconnectAttempts = 0;
          this.connected.set(true);
        },
      },
      closeObserver: {
        next: () => {
          console.log('[WebSocket] Connection closed');
          this.connected.set(false);
          this.socket$ = undefined;
          // The browser fires `close` after errors too, so scheduling here covers
          // both clean closes and failures. Reconnect only while authenticated.
          if (this.authService.isAuthenticated()) {
            this.scheduleReconnect();
          }
        },
      },
    });

    this.socket$.subscribe({
      next: (msg) => this.messagesSubject.next(msg),
      error: (err) => console.error('[WebSocket] Error:', err),
    });
  }

  private disconnect() {
    this.clearReconnectTimer();
    if (this.socket$) {
      this.socket$.complete();
      this.socket$ = undefined;
    }
    this.connected.set(false);
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;

    const delayMs = Math.min(
      BASE_RECONNECT_DELAY_MS * 2 ** this.reconnectAttempts,
      MAX_RECONNECT_DELAY_MS,
    );
    this.reconnectAttempts++;

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = undefined;
      this.connect();
    }, delayMs);
  }

  private clearReconnectTimer() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }
  }
}
