// Tipos e interfaces agnósticas para engines (sem dependências de Redux ou React)

export type EngineType = 'websocket' | 'whatsapp' | 'system';

export type MessageAction = 
  | 'message:send'
  | 'message:received'
  | 'connection:open'
  | 'connection:close'
  | 'error:occurred'
  | 'status:update';

export type MessageRoute = 
  | 'chat'
  | 'system'
  | 'notification'
  | 'command';

export interface MessageProtocol {
  id: string;
  route: MessageRoute;
  action: MessageAction;
  data: Record<string, unknown>;
  timestamp: string; // ISO string
  source: EngineType;
  sessionId?: string;
  order?: number;
  agentId?: string;
}

export interface WebSocketMessageData {
  userId?: string;
  username?: string;
  content: string;
  type: 'text' | 'image' | 'audio' | 'video';
  room?: string;
  metadata?: Record<string, unknown>;
}

export interface EngineConfig {
  url: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  autoConnect?: boolean;
}

export interface ConnectionStatus {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  lastActivity: string | null; // ISO string
}

// Interface agnóstica para engines (sem dependências de framework)
export interface MessageEngine {
  connect(): Promise<void>;
  disconnect(): void;
  sendMessage(content: string, type?: 'text' | 'image' | 'audio' | 'video', agentId?: string): void;
  isConnected(): boolean;
  getStatus(): ConnectionStatus;
  onMessage(callback: (protocol: MessageProtocol) => void): () => void; // Retorna unsubscribe
  onStatusChange(callback: (status: ConnectionStatus) => void): () => void; // Retorna unsubscribe
}

// Event handlers agnósticos
export type MessageHandler = (protocol: MessageProtocol) => void;
export type StatusChangeHandler = (status: ConnectionStatus) => void;
export type ErrorHandler = (error: Error) => void;

