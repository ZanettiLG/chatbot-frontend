// Engine WebSocket agnóstica (sem Redux, sem React)
import { createSystemMessage } from '../protocol-builder';
import { MessageEngine, EngineConfig, ConnectionStatus, MessageProtocol } from '../types';

import { parseWebSocketMessage, transformToProtocol, createOutgoingMessage } from './message-handler';
import { createReconnectionState, scheduleReconnect, resetReconnection, cancelReconnection } from './reconnection';
import { createConnection, connectWebSocket, disconnectWebSocket, sendWebSocketMessage, isWebSocketConnected } from './connection';

type MessageHandler = (protocol: MessageProtocol) => void;
type StatusChangeHandler = (status: ConnectionStatus) => void;

export class WebSocketEngine implements MessageEngine {
  private connection = createConnection({ url: '' });
  private reconnection = createReconnectionState();
  private messageHandlers: Set<MessageHandler> = new Set();
  private statusHandlers: Set<StatusChangeHandler> = new Set();
  private config: Required<EngineConfig> | null = null;

  constructor(config: EngineConfig) {
    this.config = {
      url: config.url,
      reconnectInterval: config.reconnectInterval || 5000,
      maxReconnectAttempts: config.maxReconnectAttempts || 10,
      autoConnect: config.autoConnect ?? true,
    };

    this.connection = createConnection(this.config);

    if (this.config.autoConnect) {
      this.connect();
    }
  }

  public async connect(): Promise<void> {
    if (!this.config) {
      throw new Error('Engine não foi inicializado com configuração');
    }

    // Se já está conectado, não fazer nada
    if (this.connection.ws?.readyState === WebSocket.OPEN) {
      console.log('WebSocket já está conectado');
      return;
    }

    // Se já está conectando, não criar nova conexão
    if (this.connection.ws?.readyState === WebSocket.CONNECTING) {
      console.log('WebSocket já está conectando...');
      return;
    }

    console.log('🔌 Iniciando conexão WebSocket...');
    this.connection = connectWebSocket(
      this.connection,
      () => this.handleOpen(),
      (event) => this.handleMessage(event),
      (error) => this.handleError(error),
      () => this.handleClose()
    );
  }

  public disconnect(): void {
    this.reconnection = cancelReconnection(this.reconnection);
    this.connection = disconnectWebSocket(this.connection);
    this.notifyStatusChange();
  }

  public sendMessage(content: string, type: 'text' | 'image' | 'audio' | 'video' = 'text'): void {
    const message = createOutgoingMessage(content, type);
    const sent = sendWebSocketMessage(this.connection, message);
    
    if (!sent) {
      console.error('❌ WebSocket não está conectado');
    }
  }

  public isConnected(): boolean {
    return isWebSocketConnected(this.connection);
  }

  public getStatus(): ConnectionStatus {
    return { ...this.connection.status };
  }

  public onMessage(callback: MessageHandler): () => void {
    this.messageHandlers.add(callback);
    return () => {
      this.messageHandlers.delete(callback);
    };
  }

  public onStatusChange(callback: StatusChangeHandler): () => void {
    this.statusHandlers.add(callback);
    return () => {
      this.statusHandlers.delete(callback);
    };
  }

  private handleOpen(): void {
    console.log('✅ WebSocket conectado com sucesso');
    this.reconnection = resetReconnection(this.reconnection);
    this.connection = {
      ...this.connection,
      status: {
        isConnected: true,
        isConnecting: false,
        error: null,
        lastActivity: new Date().toISOString(),
      },
    };
    this.notifyStatusChange();
    this.notifyMessage(createSystemMessage('connection:open', {}));
  }

  private handleMessage(event: MessageEvent): void {
    const parsed = parseWebSocketMessage(event);
    if (!parsed) return;

    const protocol = transformToProtocol(parsed);
    if (!protocol) return;

    this.connection = {
      ...this.connection,
      status: {
        ...this.connection.status,
        lastActivity: new Date().toISOString(),
      },
    };

    this.notifyMessage(protocol);
    this.notifyStatusChange();
  }

  private handleError(error: Event): void {
    console.error('❌ Erro no WebSocket:', error);
    this.connection = {
      ...this.connection,
      status: {
        ...this.connection.status,
        error: 'Erro na conexão WebSocket',
        isConnected: false,
      },
    };
    this.notifyStatusChange();
    this.notifyMessage(createSystemMessage('error:occurred', { error }));
  }

  private handleClose(): void {
    console.log('🔌 WebSocket desconectado');
    this.connection = {
      ...this.connection,
      status: {
        ...this.connection.status,
        isConnected: false,
        isConnecting: false,
      },
    };
    this.notifyStatusChange();
    this.notifyMessage(createSystemMessage('connection:close', {}));

    // Tentar reconectar se não foi fechamento manual
    if (!this.reconnection.isManualClose && this.config) {
      this.reconnection = scheduleReconnect(
        this.reconnection,
        this.config,
        () => this.connect()
      );
    }
  }

  private notifyMessage(protocol: MessageProtocol): void {
    this.messageHandlers.forEach(handler => {
      try {
        handler(protocol);
      } catch (error) {
        console.error('Erro em handler de mensagem:', error);
      }
    });
  }

  private notifyStatusChange(): void {
    this.statusHandlers.forEach(handler => {
      try {
        handler(this.getStatus());
      } catch (error) {
        console.error('Erro em handler de status:', error);
      }
    });
  }
}

