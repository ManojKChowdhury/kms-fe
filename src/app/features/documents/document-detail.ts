import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { DocumentDetail, DocumentService, ChatResponse } from '../../core/services/document.service';
import { WebSocketService } from '../../core/services/websocket.service';

interface ChatMessage {
  sender: 'user' | 'assistant';
  text: string;
  sources?: any[];
  timestamp: Date;
}

@Component({
  selector: 'app-document-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './document-detail.html',
  styleUrl: './document-detail.scss'
})
export class DocumentDetailComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private docService = inject(DocumentService);
  private wsService = inject(WebSocketService);

  docId!: number;
  doc = signal<DocumentDetail | null>(null);
  
  // Loading states
  isLoading = signal(true);
  isDeleting = signal(false);
  isGenerating = signal(false);

  // Tag editing
  isEditingTags = signal(false);
  editTagsString = '';

  // Chat parameters
  currentQuestion = '';
  messages: ChatMessage[] = [];

  private subs = new Subscription();

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.docId = +params['id'];
      this.loadDocumentDetails();
    });

    // Handle WebSocket broadcasts for live document updates
    const wsSub = this.wsService.messages$.subscribe(msg => {
      if (msg.event === 'doc_status' && msg.doc_id === this.docId) {
        // Refresh details
        this.loadDocumentDetails();
      }
    });
    this.subs.add(wsSub);
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  loadDocumentDetails() {
    this.docService.getDocument(this.docId).subscribe({
      next: (data) => {
        this.doc.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  deleteDocument() {
    if (!confirm('Are you sure you want to delete this document? This will remove all summaries, tags, and vector index chunks permanently.')) {
      return;
    }

    this.isDeleting.set(true);
    this.docService.deleteDocument(this.docId).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: () => {
        this.isDeleting.set(false);
        alert('Failed to delete document.');
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

    this.docService.updateTags(this.docId, list).subscribe({
      next: (updatedDoc) => {
        const current = this.doc();
        if (current) {
          this.doc.set({
            ...current,
            tags: updatedDoc.tags
          });
        }
        this.isEditingTags.set(false);
      },
      error: () => {
        alert('Failed to update tags.');
      }
    });
  }

  // --- Chat Bot Integrations ---

  sendQuestion() {
    const q = this.currentQuestion.trim();
    if (!q || this.isGenerating()) return;

    // Add user message
    this.messages.push({
      sender: 'user',
      text: q,
      timestamp: new Date()
    });
    
    this.currentQuestion = '';
    this.isGenerating.set(true);
    this.scrollToBottom();

    // Query API
    this.docService.askDocumentQuestion(this.docId, q).subscribe({
      next: (res: ChatResponse) => {
        this.isGenerating.set(false);
        this.messages.push({
          sender: 'assistant',
          text: res.answer,
          sources: res.sources,
          timestamp: new Date()
        });
        this.scrollToBottom();
      },
      error: () => {
        this.isGenerating.set(false);
        this.messages.push({
          sender: 'assistant',
          text: 'An error occurred while answering your question. Please verify your LLM credentials or try again later.',
          timestamp: new Date()
        });
        this.scrollToBottom();
      }
    });
  }

  private scrollToBottom() {
    // Scroll chat content box down using a microtask/setTimeout delay
    setTimeout(() => {
      const container = document.querySelector('.chat-messages');
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }, 50);
  }

  // --- Helper Methods ---

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
