import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import {
  BehaviorSubject,
  Subscription,
  debounceTime,
  distinctUntilChanged,
  filter,
  timer,
  switchMap,
  tap,
} from 'rxjs';
import { Document, DocumentService } from '../../core/services/document.service';
import { WebSocketService } from '../../core/services/websocket.service';
import { FileIconPipe } from '../../shared/pipes/file-icon.pipe';
import { StatusBadgePipe } from '../../shared/pipes/status-badge.pipe';

@Component({
  selector: 'app-dashboard',
  imports: [DatePipe, RouterLink, FormsModule, FileIconPipe, StatusBadgePipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit, OnDestroy {
  private docService = inject(DocumentService);
  private wsService = inject(WebSocketService);

  public documents = signal<Document[]>([]);

  // Reactive dashboard metrics derived directly from the documents signal
  readonly totalCount = computed(() => this.documents().length);
  readonly completedCount = computed(
    () => this.documents().filter((d) => d.status === 'completed').length,
  );
  readonly processingCount = computed(
    () =>
      this.documents().filter((d) => d.status === 'processing' || d.status === 'pending').length,
  );
  readonly failedCount = computed(
    () => this.documents().filter((d) => d.status === 'failed').length,
  );

  // Search properties
  searchQuery = '';
  private searchSubject = new BehaviorSubject<string>('');

  // Upload and loading states
  readonly isDragOver = signal(false);
  readonly isLoading = signal(true);
  readonly uploadingFile = signal<string | null>(null);
  readonly uploadError = signal<string | null>(null);

  private subs = new Subscription();

  ngOnInit() {
    // 1. Core RxJS Stream: debounce input search and switchMap to fetch
    const searchSub = this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        tap(() => this.isLoading.set(true)),
        switchMap((term) => this.docService.getDocuments(term)),
      )
      .subscribe({
        next: (docs) => {
          this.documents.set(docs);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false),
      });
    this.subs.add(searchSub);

    // 2. Real-time WebSocket connection to refresh status on processing events
    const wsSub = this.wsService.messages$.subscribe((msg) => {
      if (msg.event === 'doc_status') {
        this.refreshDocuments();
      }
    });
    this.subs.add(wsSub);

    // Workers run outside the API process, so polling is the durable fallback
    // when an in-memory WebSocket notification is unavailable. Only poll while
    // documents are still being processed to avoid needless network traffic.
    this.subs.add(
      timer(5000, 5000)
        .pipe(
          filter(() => this.processingCount() > 0),
          switchMap(() => this.docService.getDocuments(this.searchQuery)),
        )
        .subscribe((docs) => this.documents.set(docs)),
    );
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  refreshDocuments() {
    this.searchSubject.next(this.searchQuery);
  }

  onSearchChange(term: string) {
    this.searchQuery = term;
    this.searchSubject.next(term);
  }

  // --- Drag and Drop File Handlers ---

  onDragOver(e: DragEvent) {
    e.preventDefault();
    this.isDragOver.set(true);
  }

  onDragLeave() {
    this.isDragOver.set(false);
  }

  onDrop(e: DragEvent) {
    e.preventDefault();
    this.isDragOver.set(false);

    const file = e.dataTransfer?.files[0];
    if (file) {
      this.handleUpload(file);
    }
  }

  onFileSelected(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.handleUpload(file);
    }
    input.value = ''; // allow re-selecting the same file
  }

  private handleUpload(file: File) {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !['txt', 'md', 'pdf'].includes(ext)) {
      this.uploadError.set('Unsupported file format. Please upload .txt, .md, or .pdf files.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      this.uploadError.set('File size exceeds 10MB limit.');
      return;
    }

    this.uploadError.set(null);
    this.uploadingFile.set(file.name);

    this.docService.uploadDocument(file).subscribe({
      next: () => {
        this.uploadingFile.set(null);
        this.refreshDocuments();
      },
      error: (err) => {
        this.uploadingFile.set(null);
        this.uploadError.set(err.error?.detail || 'An error occurred during file upload.');
      },
    });
  }
}
