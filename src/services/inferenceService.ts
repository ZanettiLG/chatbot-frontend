import config from '../config/env';

export interface Thesis {
  intent: string;
  hypothesis: string;
  confidence: number;
}

export interface Antithesis {
  contradictions: string[];
  alternative_intent?: string;
}

export interface Synthesis {
  final_intent: string;
  requires_confirmation?: boolean;
  action_plan: string[] | string; // Aceita array ou string para compatibilidade
}

export interface InferenceState {
  id: string;
  sessionId: string;
  messageId: string;
  state: 'OBSERVATION' | 'ANALYSIS' | 'CONTRADICTION' | 'SYNTHESIS' | 'ACTION';
  thesis: Thesis | null;
  antithesis: Antithesis | null;
  synthesis: Synthesis | null;
  intent: string;
  confidence: number;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

class InferenceService {
  private baseUrl = `${config.apiUrl}/inference`;

  async getHistory(sessionId: string, limit?: number): Promise<InferenceState[]> {
    const url = limit 
      ? `${this.baseUrl}/${sessionId}/history?limit=${limit}`
      : `${this.baseUrl}/${sessionId}/history`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        // Se for 404, retornar array vazio (não há dados ainda)
        if (response.status === 404) {
          return [];
        }
        throw new Error(`Failed to fetch inference history: ${response.statusText}`);
      }
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      // Em caso de erro de rede, retornar array vazio
      console.warn('Error fetching inference history:', error);
      return [];
    }
  }

  async getLatest(sessionId: string): Promise<InferenceState | null> {
    try {
      const response = await fetch(`${this.baseUrl}/${sessionId}/latest`);
      if (!response.ok) {
        // Se for 404 ou qualquer outro erro, retornar null (não há dados ainda)
        if (response.status === 404) {
          return null;
        }
        // Para outros erros, também retornar null silenciosamente
        console.warn(`Failed to fetch latest inference: ${response.statusText}`);
        return null;
      }
      const data = await response.json();
      return data;
    } catch (error) {
      // Em caso de erro de rede, retornar null silenciosamente
      console.warn('Error fetching latest inference:', error);
      return null;
    }
  }

  async getByMessageId(messageId: string): Promise<InferenceState | null> {
    try {
      const response = await fetch(`${this.baseUrl}/message/${messageId}`);
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Failed to fetch inference by message: ${response.statusText}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      // Em caso de erro de rede, retornar null silenciosamente
      console.warn('Error fetching inference by messageId:', error);
      return null;
    }
  }
}

export const inferenceService = new InferenceService();

