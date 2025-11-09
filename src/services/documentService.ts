import config from '../config/env';

export interface Document {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;
}

export interface CreateDocumentData {
  title: string;
  content: string;
  metadata?: Record<string, any>;
}

export interface UpdateDocumentData {
  title?: string;
  content?: string;
  metadata?: Record<string, any>;
}

class DocumentService {
  private baseUrl = `${config.apiUrl}/documents`;

  async getAll(): Promise<Document[]> {
    const response = await fetch(this.baseUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch documents: ${response.statusText}`);
    }
    return response.json();
  }

  async getById(id: string): Promise<Document> {
    const response = await fetch(`${this.baseUrl}/${id}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch document: ${response.statusText}`);
    }
    return response.json();
  }

  async create(data: CreateDocumentData): Promise<Document> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`Failed to create document: ${response.statusText}`);
    }
    return response.json();
  }

  async update(id: string, data: UpdateDocumentData): Promise<Document> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`Failed to update document: ${response.statusText}`);
    }
    return response.json();
  }

  async delete(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error(`Failed to delete document: ${response.statusText}`);
    }
  }
}

export const documentService = new DocumentService();

