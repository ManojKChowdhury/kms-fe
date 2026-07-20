import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AgentService, AgentKey } from '../../core/services/agent.service';

@Component({
  selector: 'app-agent-keys',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './agent-keys.html',
  styleUrl: './agent-keys.scss'
})
export class AgentKeysComponent implements OnInit {
  private agentService = inject(AgentService);

  newKeyName = '';
  keys = signal<AgentKey[]>([]);
  newlyCreatedKey = signal<string | null>(null);
  
  // Loader states
  isLoading = signal(true);
  isGenerating = signal(false);
  isCopied = signal(false);
  isCurlCopied = signal(false);

  // curl code block example
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
      error: () => this.isLoading.set(false)
    });
  }

  generateKey() {
    const name = this.newKeyName.trim();
    if (!name || this.isGenerating()) return;

    this.isGenerating.set(true);
    this.newlyCreatedKey.set(null);
    this.isCopied.set(false);

    this.agentService.createKey(name).subscribe({
      next: (res) => {
        this.isGenerating.set(false);
        this.newKeyName = '';
        this.newlyCreatedKey.set(res.api_key);
        // Refresh key lists (which returns keys without raw plaintext)
        this.fetchKeys();
      },
      error: () => {
        this.isGenerating.set(false);
        alert('Failed to generate key.');
      }
    });
  }

  revokeKey(id: number) {
    if (!confirm('Are you sure you want to revoke this API key? External agents using this key will immediately be denied access.')) {
      return;
    }

    this.agentService.revokeKey(id).subscribe({
      next: () => {
        this.keys.update(list => list.filter(k => k.id !== id));
      },
      error: () => {
        alert('Failed to revoke key.');
      }
    });
  }

  copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      if (text === this.newlyCreatedKey()) {
        this.isCopied.set(true);
        setTimeout(() => this.isCopied.set(false), 2000);
      } else {
        this.isCurlCopied.set(true);
        setTimeout(() => this.isCurlCopied.set(false), 2000);
      }
    }).catch(err => {
      console.error('Clipboard copy failed:', err);
    });
  }
}
