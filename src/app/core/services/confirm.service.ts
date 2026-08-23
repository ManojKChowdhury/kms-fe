import { Injectable, signal } from '@angular/core';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
}

interface PendingConfirm extends ConfirmOptions {
  resolve: (confirmed: boolean) => void;
}

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  private readonly pendingSignal = signal<PendingConfirm | null>(null);

  readonly request = this.pendingSignal.asReadonly();

  confirm(options: ConfirmOptions): Promise<boolean> {
    return new Promise(resolve => {
      this.pendingSignal.set({ ...options, resolve });
    });
  }

  accept(): void {
    this.pendingSignal()?.resolve(true);
    this.pendingSignal.set(null);
  }

  dismiss(): void {
    this.pendingSignal()?.resolve(false);
    this.pendingSignal.set(null);
  }
}
