import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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

  constructor(private http: HttpClient) {}

  getKeys(): Observable<AgentKey[]> {
    return this.http.get<AgentKey[]>(this.apiUrl);
  }

  createKey(name: string): Observable<AgentKeyCreated> {
    return this.http.post<AgentKeyCreated>(this.apiUrl, { name });
  }

  revokeKey(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
