import { Component, OnDestroy, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { Subscription, map, tap } from 'rxjs';
import { DocumentDetail, DocumentService } from '../../core/services/document.service';
import { WebSocketService } from '../../core/services/websocket.service';
import { ToastService } from '../../core/services/toast.service';
import { ConfirmService } from '../../core/services/confirm.service';
import { FileIconPipe } from '../../shared/pipes/file-icon.pipe';
import { StatusBadgePipe } from '../../shared/pipes/status-badge.pipe';
import { ChatPanelComponent } from '../../shared/components/chat-panel/chat-panel.component';

@Component({
  selector: 'app-document-detail',
  imports: [DatePipe, RouterLink, FormsModule, FileIconPipe, StatusBadgePipe, ChatPanelComponent],
  templateUrl: './document-detail.component.html',
  styleUrl: './document-detail.component.scss'
})
export class DocumentDetailComponent implements OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private docService = inject(DocumentService);
  private wsService = inject(WebSocketService);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);

  // Reactive route param: reloads details whenever :id changes.
  private readonly docId = toSignal(
    this.route.paramMap.pipe(map(params => Number(params.get('id')))),
    { initialValue: 0 }
  );

  doc = signal<DocumentDetail | null>(null);

  // Loading states
  readonly isLoading = signal(true);
  readonly isDeleting = signal(false);

  // Tag editing
  readonly isEditingTags = signal(false);
  editTagsString = '';

  readonly chatErrorMessage =
    'An error occurred while answering your question. Please verify your LLM credentials or try again later.';

  protected readonly askDocument = (question: string) =>
    this.docService.askDocumentQuestion(this.docId(), question);

  private subs = new Subscription();

  constructor() {
    this.subs.add(
      toObservable(this.docId)
        .pipe(tap(() => this.loadDocumentDetails()))
        .subscribe()
    );

    // Handle WebSocket broadcasts for live document updates
    this.subs.add(
      this.wsService.messages$.subscribe(msg => {
        if (msg.event === 'doc_status' && msg.doc_id === this.docId()) {
          this.loadDocumentDetails();
        }
      })
    );
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  loadDocumentDetails() {
    const id = this.docId();
    if (!id) return;

    this.docService.getDocument(id).subscribe({
      next: (data) => {
        this.doc.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  async deleteDocument() {
    const confirmed = await this.confirm.confirm({
      title: 'Delete document?',
      message: 'This will remove the document along with all summaries, tags and vector index chunks permanently.',
      confirmLabel: 'Delete'
    });
    if (!confirmed) return;

    this.isDeleting.set(true);
    this.docService.deleteDocument(this.docId()).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.toast.success('Document deleted.');
        this.router.navigate(['/dashboard']);
      },
      error: () => {
        this.isDeleting.set(false);
        this.toast.error('Failed to delete document.');
      }
    });
  }

  // --- Tag Editing Actions ---

  startEditTags() {
    this.editTagsString = this.doc()?.tags.join(', ') || '';
    this.isEditingTags.set(true);
  }

  cancelEditTags() {
    this.isEditingTags.set(false);
  }

  saveTags() {
    const list = this.editTagsString.split(',')
      .map(t => t.trim().toLowerCase())
      .filter(t => t.length > 0);

    this.docService.updateTags(this.docId(), list).subscribe({
      next: (updatedDoc) => {
        const current = this.doc();
        if (current) {
          this.doc.set({
            ...current,
            tags: updatedDoc.tags
          });
        }
        this.isEditingTags.set(false);
        this.toast.success('Tags updated.');
      },
      error: () => {
        this.toast.error('Failed to update tags.');
      }
    });
  }
}
