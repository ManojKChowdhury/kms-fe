import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface AgentKey {
  id: number;
  name: string;
  is_active: boolean;
  created_at: string;
}

export interface AgentKeyCreated extends AgentKey {
  api_key: string;
}

@Injectable({
  providedIn: 'root'
})
export class AgentService {
  private readonly apiUrl = 'http://localhost:8000/api/v1/agents';

  constructor(private http: HttpClient, private authService: AuthService) {}

  getKeys(): Observable<AgentKey[]> {
    return this.http.get<AgentKey[]>(this.apiUrl, {
      headers: this.authService.getAuthHeaders()
    });
  }

  createKey(name: string): Observable<AgentKeyCreated> {
    return this.http.post<AgentKeyCreated>(
      this.apiUrl,
      { name },
      { headers: this.authService.getAuthHeaders() }
    );
  }

  revokeKey(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, {
      headers: this.authService.getAuthHeaders()
    });
  }
}
