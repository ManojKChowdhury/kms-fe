import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ENVIRONMENT_TOKEN } from './auth.service';

export interface AgentKey {
  id: number;
  name: string;
  is_active: boolean;
  created_at: string;
  scopes: string[];
}

export interface AgentKeyCreated extends AgentKey {
  api_key: string;
}

@Injectable({
  providedIn: 'root',
})
export class AgentService {
  private readonly env = inject(ENVIRONMENT_TOKEN);
  private readonly apiUrl = `${this.env.apiUrl}/agents`;

  constructor(private http: HttpClient) {}

  getKeys(): Observable<AgentKey[]> {
    return this.http.get<AgentKey[]>(this.apiUrl);
  }

  createKey(name: string): Observable<AgentKeyCreated> {
    return this.http.post<AgentKeyCreated>(this.apiUrl, {
      name,
      scopes: ['documents:read', 'chat'],
    });
  }

  revokeKey(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
