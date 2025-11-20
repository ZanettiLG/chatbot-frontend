import config from '../config/env';
import { ConversationState } from '../types/goap.types';

class ConversationStateService {
  private baseUrl = `${config.apiUrl}/conversation-states`;

  async getBySessionId(sessionId: string): Promise<ConversationState | null> {
    try {
      const response = await fetch(`${this.baseUrl}/${sessionId}`);
      if (response.status === 404) {
        return null;
      }
      if (!response.ok) {
        throw new Error('Failed to fetch conversation state');
      }
      return response.json();
    } catch (error) {
      console.warn('Error fetching conversation state:', error);
      return null;
    }
  }
}

export const conversationStateService = new ConversationStateService();

