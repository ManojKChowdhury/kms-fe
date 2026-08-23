import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AgentService, AgentKey } from '../../core/services/agent.service';
import { ConfirmService } from '../../core/services/confirm.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-agent-keys',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './agent-keys.component.html',
  styleUrl: './agent-keys.component.scss',
})
export class AgentKeysComponent implements OnInit {
  private agentService = inject(AgentService);
  private confirm = inject(ConfirmService);
  private toast = inject(ToastService);

  newKeyName = '';
  keys = signal<AgentKey[]>([]);
  newlyCreatedKey = signal<string | null>(null);

  isLoading = signal(true);
  isGenerating = signal(false);
  isCopied = signal(false);
  isCurlCopied = signal(false);

  readonly curlCommand = `curl -X POST http://localhost:8000/api/v1/documents/chat \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: kms_your_generated_secret_token_here" \\
  -d '{
    "question": "Does this document mention OAuth2 integration details?"
  }'`;

  ngOnInit() {
    this.fetchKeys();
  }

  fetchKeys() {
    this.agentService.getKeys().subscribe({
      next: (data) => {
        this.keys.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.toast.error('Failed to load API keys.');
      },
    });
  }

  async generateKey() {
    const name = this.newKeyName.trim();
    if (!name || this.isGenerating()) return;

    this.isGenerating.set(true);
    this.newlyCreatedKey.set(null);

    this.agentService.createKey(name).subscribe({
      next: (res) => {
        this.isGenerating.set(false);
        this.newKeyName = '';
        this.newlyCreatedKey.set(res.api_key);
        this.toast.success('API key generated.');
        this.fetchKeys();
      },
      error: () => {
        this.isGenerating.set(false);
        this.toast.error('Failed to generate key.');
      },
    });
  }

  async revokeKey(id: number) {
    const confirmed = await this.confirm.confirm({
      title: 'Revoke API key?',
      message: 'External agents using this key will immediately be denied access.',
      confirmLabel: 'Revoke',
    });
    if (!confirmed) return;

    this.agentService.revokeKey(id).subscribe({
      next: () => {
        this.keys.update((list) => list.filter((k) => k.id !== id));
        this.toast.success('API key revoked.');
      },
      error: () => {
        this.toast.error('Failed to revoke key.');
      },
    });
  }

  copyToClipboard(text: string) {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        if (text === this.newlyCreatedKey()) {
          this.isCopied.set(true);
          setTimeout(() => this.isCopied.set(false), 2000);
        } else {
          this.isCurlCopied.set(true);
          setTimeout(() => this.isCurlCopied.set(false), 2000);
        }
      })
      .catch((err) => {
        console.error('Clipboard copy failed:', err);
        this.toast.error('Could not copy to clipboard.');
      });
  }
}
