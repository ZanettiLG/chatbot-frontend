import config from '../config/env';

export interface WhatsAppSession {
  id: string;
  name: string;
  phoneNumber: string | null;
  agentId: string;
  sessionName: string;
  status: 'disconnected' | 'connecting' | 'qr_required' | 'connected' | 'error';
  qrCode?: string;
  error?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;
  agent?: { id: string; name: string };
}

export interface CreateWhatsAppSessionData {
  name: string;
  phoneNumber?: string;
  agentId: string;
  sessionName?: string;
  metadata?: Record<string, any>;
}

export interface UpdateWhatsAppSessionData {
  name?: string;
  agentId?: string;
  isActive?: boolean;
  metadata?: Record<string, any>;
}

class WhatsAppSessionService {
  private baseUrl = `${config.apiUrl}/whatsapp-sessions`;

  async getAll(activeOnly?: boolean): Promise<WhatsAppSession[]> {
    const url = activeOnly ? `${this.baseUrl}?active=true` : this.baseUrl;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch WhatsApp sessions: ${response.statusText}`);
    }
    return response.json();
  }

  async getById(id: string): Promise<WhatsAppSession> {
    const response = await fetch(`${this.baseUrl}/${id}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch WhatsApp session: ${response.statusText}`);
    }
    return response.json();
  }

  async create(data: CreateWhatsAppSessionData): Promise<WhatsAppSession> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || `Failed to create WhatsApp session: ${response.statusText}`);
    }
    return response.json();
  }

  async update(id: string, data: UpdateWhatsAppSessionData): Promise<WhatsAppSession> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || `Failed to update WhatsApp session: ${response.statusText}`);
    }
    return response.json();
  }

  async delete(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error(`Failed to delete WhatsApp session: ${response.statusText}`);
    }
  }

  async initialize(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${id}/initialize`, {
      method: 'POST',
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || `Failed to initialize WhatsApp session: ${response.statusText}`);
    }
  }

  async close(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${id}/close`, {
      method: 'POST',
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || `Failed to close WhatsApp session: ${response.statusText}`);
    }
  }

  async getStatus(id: string): Promise<{
    status: string;
    phoneNumber?: string;
    error?: string;
    qrCode?: string;
  }> {
    const response = await fetch(`${this.baseUrl}/${id}/status`);
    if (!response.ok) {
      throw new Error(`Failed to get WhatsApp session status: ${response.statusText}`);
    }
    return response.json();
  }

  async getQRCode(id: string): Promise<{ qrCode: string }> {
    const response = await fetch(`${this.baseUrl}/${id}/qr`);
    if (!response.ok) {
      throw new Error(`Failed to get QR Code: ${response.statusText}`);
    }
    return response.json();
  }
}

export const whatsappSessionService = new WhatsAppSessionService();

