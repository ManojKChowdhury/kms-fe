import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DocumentService, ChatResponse } from '../../core/services/document.service';

interface ChatMessage {
  sender: 'user' | 'assistant';
  text: string;
  sources?: any[];
  timestamp: Date;
}

@Component({
  selector: 'app-global-chat',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './global-chat.html',
  styleUrl: './global-chat.scss'
})
export class GlobalChatComponent {
  private docService = inject(DocumentService);

  currentQuestion = '';
  messages: ChatMessage[] = [];
  isGenerating = signal(false);

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

    // Query global chat API
    this.docService.askGlobalQuestion(q).subscribe({
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
          text: 'An error occurred while communicating with the AI search server. Please ensure the backend is running and correct LLM providers are configured.',
          timestamp: new Date()
        });
        this.scrollToBottom();
      }
    });
  }

  private scrollToBottom() {
    setTimeout(() => {
      const container = document.querySelector('.chat-messages');
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }, 50);
  }
}
