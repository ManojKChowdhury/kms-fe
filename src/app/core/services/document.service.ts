import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ENVIRONMENT_TOKEN } from './auth.service';

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
  document_id?: number;
  document_title?: string;
  chunk_index: number;
  similarity_score: number;
  page_number?: number;
  excerpt?: string;
}

export interface ChatResponse {
  answer: string;
  sources: SourceDetail[];
}

@Injectable({
  providedIn: 'root',
})
export class DocumentService {
  private readonly env = inject(ENVIRONMENT_TOKEN);
  private readonly apiUrl = `${this.env.apiUrl}/documents`;

  constructor(private http: HttpClient) {}

  getDocuments(search?: string): Observable<Document[]> {
    const params = new HttpParams({ fromObject: search ? { search } : {} });

    return this.http.get<Document[]>(this.apiUrl, { params });
  }

  getDocument(id: number): Observable<DocumentDetail> {
    return this.http.get<DocumentDetail>(`${this.apiUrl}/${id}`);
  }

  uploadDocument(file: File): Observable<Document> {
    const formData = new FormData();
    formData.append('file', file);

    // Content-Type is intentionally omitted so the browser sets the multipart boundary.
    return this.http.post<Document>(`${this.apiUrl}/upload`, formData);
  }

  deleteDocument(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  updateTags(id: number, tags: string[]): Observable<Document> {
    return this.http.put<Document>(`${this.apiUrl}/${id}/tags`, { tags });
  }

  reprocessDocument(id: number): Observable<Document> {
    return this.http.post<Document>(`${this.apiUrl}/${id}/reprocess`, {});
  }

  askDocumentQuestion(id: number, question: string): Observable<ChatResponse> {
    return this.http.post<ChatResponse>(`${this.apiUrl}/${id}/chat`, { question });
  }

  askGlobalQuestion(question: string): Observable<ChatResponse> {
    return this.http.post<ChatResponse>(`${this.apiUrl}/chat`, { question });
  }
}
