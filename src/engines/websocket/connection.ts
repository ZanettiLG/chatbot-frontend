// Lógica pura de conexão WebSocket (sem dependências de estado ou Redux)
import { EngineConfig, ConnectionStatus } from '../types';

export interface WebSocketConnection {
  ws: WebSocket | null;
  status: ConnectionStatus;
  config: Required<EngineConfig>;
}

export const createConnection = (config: EngineConfig): WebSocketConnection => ({
  ws: null,
  status: {
    isConnected: false,
    isConnecting: false,
    error: null,
    lastActivity: null,
  },
  config: {
    url: config.url,
    reconnectInterval: config.reconnectInterval || 5000,
    maxReconnectAttempts: config.maxReconnectAttempts || 10,
    autoConnect: config.autoConnect ?? true,
  },
});

export const connectWebSocket = (
  connection: WebSocketConnection,
  onOpen: () => void,
  onMessage: (event: MessageEvent) => void,
  onError: (error: Event) => void,
  onClose: () => void
): WebSocketConnection => {
  // Se já existe uma conexão aberta, não criar nova
  if (connection.ws?.readyState === WebSocket.OPEN) {
    return connection;
  }

  // Se já existe uma conexão em processo (CONNECTING), não criar nova
  if (connection.ws?.readyState === WebSocket.CONNECTING) {
    return connection;
  }

  // Fechar conexão anterior se existir
  if (connection.ws) {
    connection.ws.close();
  }

  const ws = new WebSocket(connection.config.url);
  
  ws.onopen = () => {
    onOpen();
  };

  ws.onmessage = (event) => {
    onMessage(event);
  };

  ws.onerror = (error) => {
    onError(error);
  };

  ws.onclose = () => {
    onClose();
  };

  return {
    ...connection,
    ws,
    status: {
      ...connection.status,
      isConnecting: true,
    },
  };
};

export const disconnectWebSocket = (connection: WebSocketConnection): WebSocketConnection => {
  if (connection.ws) {
    connection.ws.close();
  }
  
  return {
    ...connection,
    ws: null,
    status: {
      ...connection.status,
      isConnected: false,
      isConnecting: false,
    },
  };
};

export const sendWebSocketMessage = (
  connection: WebSocketConnection,
  message: string
): boolean => {
  if (!connection.ws || connection.ws.readyState !== WebSocket.OPEN) {
    return false;
  }

  try {
    connection.ws.send(message);
    return true;
  } catch (error) {
    console.error('Erro ao enviar mensagem WebSocket:', error);
    return false;
  }
};

export const isWebSocketConnected = (connection: WebSocketConnection): boolean => {
  return connection.ws?.readyState === WebSocket.OPEN || false;
};

