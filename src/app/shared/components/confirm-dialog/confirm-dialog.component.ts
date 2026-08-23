import { Component, ElementRef, effect, inject, viewChild } from '@angular/core';
import { ConfirmService } from '../../../core/services/confirm.service';

@Component({
  selector: 'app-confirm-dialog',
  template: `
    @if (confirmService.request(); as req) {
      <div class="dialog-backdrop" (click)="confirmService.dismiss()">
        <div
          class="dialog-card glass"
          role="alertdialog"
          aria-modal="true"
          [attr.aria-label]="req.title"
          (click)="$event.stopPropagation()"
        >
          <h3 class="dialog-title">{{ req.title }}</h3>
          <p class="dialog-message">{{ req.message }}</p>
          <div class="dialog-actions">
            <button type="button" class="btn btn-secondary" (click)="confirmService.dismiss()">
              Cancel
            </button>
            <button
              type="button"
              #confirmButton
              class="btn"
              [class.btn-danger]="req.danger !== false"
              [class.btn-primary]="req.danger === false"
              (click)="confirmService.accept()"
            >
              {{ req.confirmLabel || 'Confirm' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: `
    .dialog-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1100;
      padding: 1.5rem;
    }

    .dialog-card {
      width: 100%;
      max-width: 420px;
      padding: 1.75rem;
      background: var(--bg-secondary);
    }

    .dialog-title {
      font-size: 1.2rem;
      margin-bottom: 0.75rem;
    }

    .dialog-message {
      font-size: 0.9rem;
      color: var(--text-secondary);
      line-height: 1.5;
      margin-bottom: 1.5rem;
    }

    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
    }
  `,
  host: {
    '(document:keydown.escape)': 'confirmService.dismiss()'
  }
})
export class ConfirmDialogComponent {
  protected readonly confirmService = inject(ConfirmService);

  private readonly confirmButton = viewChild<ElementRef<HTMLButtonElement>>('confirmButton');

  constructor() {
    // Move focus into the dialog whenever it opens.
    effect(() => {
      if (this.confirmService.request()) {
        this.confirmButton()?.nativeElement.focus();
      }
    });
  }
}
