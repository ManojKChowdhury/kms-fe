import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface Document {
  id: number;
  title: string;
  summary: string | null;
  tags: string[];
  file_type: string;
  status: string;
  owner_id: number;
  created_at: string;
  updated_at: string;
}

export interface DocumentDetail extends Document {
  content: string;
}

export interface SourceDetail {
  document_id: number;
  document_title: string;
  chunk_index: number;
  similarity_score: number;
}

export interface ChatResponse {
  answer: string;
  sources: SourceDetail[];
}

@Injectable({
  providedIn: 'root'
})
export class DocumentService {
  private readonly apiUrl = 'http://localhost:8000/api/v1/documents';

  constructor(private http: HttpClient, private authService: AuthService) {}

  getDocuments(search?: string): Observable<Document[]> {
    const params: any = {};
    if (search) params.search = search;
    
    return this.http.get<Document[]>(this.apiUrl, {
      headers: this.authService.getAuthHeaders(),
      params
    });
  }

  getDocument(id: number): Observable<DocumentDetail> {
    return this.http.get<DocumentDetail>(`${this.apiUrl}/${id}`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  uploadDocument(file: File): Observable<Document> {
    const formData = new FormData();
    formData.append('file', file);
    
    // Custom header injection for file upload (excluding Content-Type to let browser set boundary)
    const headers = this.authService.getAuthHeaders();
    
    return this.http.post<Document>(`${this.apiUrl}/upload`, formData, { headers });
  }

  deleteDocument(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  updateTags(id: number, tags: string[]): Observable<Document> {
    return this.http.put<Document>(
      `${this.apiUrl}/${id}/tags`,
      { tags },
      { headers: this.authService.getAuthHeaders() }
    );
  }

  askDocumentQuestion(id: number, question: string): Observable<ChatResponse> {
    return this.http.post<ChatResponse>(
      `${this.apiUrl}/${id}/chat`,
      { question },
      { headers: this.authService.getAuthHeaders() }
    );
  }

  askGlobalQuestion(question: string): Observable<ChatResponse> {
    return this.http.post<ChatResponse>(
      `${this.apiUrl}/chat`,
      { question },
      { headers: this.authService.getAuthHeaders() }
    );
  }
}
