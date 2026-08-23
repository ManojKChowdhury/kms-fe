import { Component, inject } from '@angular/core';
import { DocumentService } from '../../core/services/document.service';
import { ChatPanelComponent } from '../../shared/components/chat-panel/chat-panel.component';

@Component({
  selector: 'app-global-chat',
  imports: [ChatPanelComponent],
  templateUrl: './global-chat.component.html',
  styleUrl: './global-chat.component.scss'
})
export class GlobalChatComponent {
  private docService = inject(DocumentService);

  readonly chatErrorMessage =
    'An error occurred while communicating with the AI search server. Please ensure the backend is running and correct LLM providers are configured.';

  protected readonly askGlobal = (question: string) =>
    this.docService.askGlobalQuestion(question);
}
