// Handler puro para processar mensagens WebSocket (transformação de dados)
import { createSystemMessage, createProtocol } from '../protocol-builder';
import { MessageProtocol, WebSocketMessageData, EngineType } from '../types';

export interface ParsedWebSocketData {
  type?: string;
  body?: string;
  action?: string;
  userId?: string;
  content?: string;
  username?: string;
  timestamp?: string | number;
  data?: Record<string, unknown>;
}

export const parseWebSocketMessage = (event: MessageEvent): ParsedWebSocketData | null => {
  try {
    return JSON.parse(event.data);
  } catch (error) {
    console.error('Erro ao parsear mensagem WebSocket:', error);
    return null;
  }
};

export const transformToProtocol = (data: ParsedWebSocketData): MessageProtocol | null => {
  // Mensagem de chat
  if (data.type === 'message' || data.action === 'message:received') {
    const messageData = data.data || data;
    
    const wsData: WebSocketMessageData = {
      userId: messageData.userId || data.userId,
      username: messageData.username || data.username,
      content: messageData.content || data.content || messageData.body || '',
      type: messageData.type || 'text',
      metadata: messageData.metadata,
    };

    // IMPORTANTE: Preservar o source do backend se disponível
    // O backend envia 'system' para respostas do agente e 'websocket' para mensagens do usuário
    const source = data.source || messageData.source || 'websocket';
    
    return createProtocol('chat', 'message:received', wsData, source as EngineType);
  }

  // Eventos de conexão
  if (data.action === 'connection:open') {
    return createSystemMessage('connection:open', data.data || {});
  }

  if (data.action === 'connection:close') {
    return createSystemMessage('connection:close', data.data || {});
  }

  // Erros
  if (data.action === 'error:occurred') {
    return createSystemMessage('error:occurred', { error: data.data || data });
  }

  return null;
};

export const createOutgoingMessage = (
  content: string,
  type: 'text' | 'image' | 'audio' | 'video' = 'text'
): string => {
  return JSON.stringify({
    type: 'message',
    data: {
      content,
      type,
      timestamp: new Date().toISOString(),
    },
  });
};

