import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { BehaviorSubject, Subscription, debounceTime, distinctUntilChanged, switchMap, tap } from 'rxjs';
import { Document, DocumentService } from '../../core/services/document.service';
import { WebSocketService } from '../../core/services/websocket.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit, OnDestroy {
  private docService = inject(DocumentService);
  private wsService = inject(WebSocketService);

  documents: Document[] = [];
  
  // Reactive dashboard metrics
  totalCount = signal(0);
  completedCount = signal(0);
  processingCount = signal(0);
  failedCount = signal(0);
  
  // Search properties
  searchQuery = '';
  private searchSubject = new BehaviorSubject<string>('');
  
  // Upload and loading states
  isDragOver = signal(false);
  isLoading = signal(true);
  uploadingFile = signal<string | null>(null);
  uploadError = signal<string | null>(null);

  // Subscriptions
  private subs = new Subscription();

  ngOnInit() {
    // 1. Core RxJS Stream: debounce input search and switchMap to fetch
    const searchSub = this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      tap(() => this.isLoading.set(true)),
      switchMap(term => this.docService.getDocuments(term))
    ).subscribe({
      next: (docs) => {
        this.documents = docs;
        this.isLoading.set(false);
        this.recalculateMetrics();
      },
      error: () => this.isLoading.set(false)
    });
    this.subs.add(searchSub);

    // 2. Real-time WebSocket connection to refresh status on processing events
    const wsSub = this.wsService.messages$.subscribe(msg => {
      if (msg.event === 'doc_status') {
        this.refreshDocuments();
      }
    });
    this.subs.add(wsSub);
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  refreshDocuments() {
    this.searchSubject.next(this.searchQuery);
  }

  onSearchChange(term: string) {
    this.searchSubject.next(term);
  }

  recalculateMetrics() {
    this.totalCount.set(this.documents.length);
    this.completedCount.set(this.documents.filter(d => d.status === 'completed').length);
    this.processingCount.set(this.documents.filter(d => d.status === 'processing' || d.status === 'pending').length);
    this.failedCount.set(this.documents.filter(d => d.status === 'failed').length);
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
    
    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      this.handleUpload(e.dataTransfer.files[0]);
    }
  }

  onFileSelected(e: any) {
    if (e.target.files && e.target.files.length > 0) {
      this.handleUpload(e.target.files[0]);
    }
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
      }
    });
  }

  // --- Display Helpers ---

  getFileIcon(ext: string): string {
    switch (ext) {
      case 'pdf': return '📕';
      case 'md': return '📘';
      default: return '📄';
    }
  }

  getBadgeClass(status: string): string {
    switch (status) {
      case 'completed': return 'badge-completed';
      case 'processing': return 'badge-processing';
      case 'failed': return 'badge-failed';
      default: return 'badge-pending';
    }
  }
}
