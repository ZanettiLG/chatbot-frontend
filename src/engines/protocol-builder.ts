// Builder funcional para criar protocolos de mensagem (agnóstico)
import {
  EngineType,
  MessageRoute,
  MessageAction,
  MessageProtocol,
  WebSocketMessageData,
} from './types';

export const createProtocol = (
  route: MessageRoute,
  action: MessageAction,
  data: Record<string, unknown>,
  source: EngineType = 'system'
): MessageProtocol => ({
  id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  route,
  action,
  data,
  timestamp: new Date().toISOString(),
  source,
});

export const createWebSocketMessage = (
  data: WebSocketMessageData,
  action: MessageAction = 'message:received'
): MessageProtocol => 
  createProtocol('chat', action, data, 'websocket');

export const createSystemMessage = (
  action: MessageAction,
  data: Record<string, unknown> = {}
): MessageProtocol => 
  createProtocol('system', action, data, 'system');

export const createConnectionMessage = (
  action: 'connection:open' | 'connection:close',
  data: Record<string, unknown> = {}
): MessageProtocol => 
  createProtocol('system', action, data, 'system');

