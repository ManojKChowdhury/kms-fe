import { Component, ElementRef, effect, inject, viewChild } from '@angular/core';
import { ConfirmService } from '../../../core/services/confirm.service';

@Component({
  selector: 'app-confirm-dialog',
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.scss',
  host: {
    '(document:keydown.escape)': 'confirmService.dismiss()',
  },
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
