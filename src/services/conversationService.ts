import config from '../config/env';

export interface Conversation {
  id: string;
  sessionId: string;
  provider: 'websocket' | 'whatsapp';
  agentId: string;
  contactIdentifier: string;
  contactName?: string;
  status: 'active' | 'archived' | 'closed';
  lastMessageAt: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;
}

class ConversationService {
  private baseUrl = `${config.apiUrl}/conversations`;

  async getAll(filters?: { provider?: string; status?: string; agentId?: string }): Promise<Conversation[]> {
    const params = new URLSearchParams();
    if (filters?.provider) params.append('provider', filters.provider);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.agentId) params.append('agentId', filters.agentId);
    const url = params.toString() ? `${this.baseUrl}?${params}` : this.baseUrl;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch conversations');
    }
    return response.json();
  }

  async getById(id: string): Promise<Conversation> {
    const response = await fetch(`${this.baseUrl}/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch conversation');
    }
    return response.json();
  }

  async archive(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${id}/archive`, {
      method: 'PUT',
    });
    if (!response.ok) {
      throw new Error('Failed to archive conversation');
    }
  }

  async sendMessage(id: string, message: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${id}/send-message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    });
    if (!response.ok) {
      throw new Error('Failed to send message');
    }
  }

  async getMessages(id: string, limit?: number): Promise<any[]> {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    const url = params.toString() ? `${this.baseUrl}/${id}/messages?${params}` : `${this.baseUrl}/${id}/messages`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch conversation messages');
    }
    return response.json();
  }
}

export const conversationService = new ConversationService();

