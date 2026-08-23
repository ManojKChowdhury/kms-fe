import { Component, ElementRef, input, signal, viewChild } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { ChatResponse, SourceDetail } from '../../../core/services/document.service';

export interface ChatMessage {
  sender: 'user' | 'assistant';
  text: string;
  sources?: SourceDetail[];
  timestamp: Date;
}

/**
 * Reusable RAG chat panel: message stream, citations and input bar.
 * The parent supplies the question handler via the `ask` input and can
 * project an empty-state into the `[chatEmpty]` slot.
 */
@Component({
  selector: 'app-chat-panel',
  imports: [DatePipe, DecimalPipe, FormsModule, RouterLink],
  templateUrl: './chat-panel.component.html',
  styleUrl: './chat-panel.component.scss'
})
export class ChatPanelComponent {
  /** Handler performing the actual question round-trip. */
  readonly ask = input.required<(question: string) => Observable<ChatResponse>>();
  readonly placeholder = input('Ask something...');
  readonly submitLabel = input('Send');
  readonly errorMessage = input('Something went wrong. Please try again.');
  readonly sourcesLabel = input('Sources consulted:');
  readonly disabled = input(false);

  private readonly messagesContainer =
    viewChild.required<ElementRef<HTMLDivElement>>('messagesContainer');

  protected readonly messages = signal<ChatMessage[]>([]);
  protected readonly question = signal('');
  protected readonly isGenerating = signal(false);

  protected sendQuestion() {
    const q = this.question().trim();
    if (!q || this.isGenerating() || this.disabled()) return;

    this.messages.update(list => [
      ...list,
      { sender: 'user', text: q, timestamp: new Date() }
    ]);
    this.question.set('');
    this.isGenerating.set(true);
    this.scrollToBottom();

    this.ask()(q).subscribe({
      next: res => {
        this.isGenerating.set(false);
        this.messages.update(list => [
          ...list,
          { sender: 'assistant', text: res.answer, sources: res.sources, timestamp: new Date() }
        ]);
        this.scrollToBottom();
      },
      error: () => {
        this.isGenerating.set(false);
        this.messages.update(list => [
          ...list,
          { sender: 'assistant', text: this.errorMessage(), timestamp: new Date() }
        ]);
        this.scrollToBottom();
      }
    });
  }

  private scrollToBottom() {
    setTimeout(() => {
      const el = this.messagesContainer().nativeElement;
      el.scrollTop = el.scrollHeight;
    });
  }
}
