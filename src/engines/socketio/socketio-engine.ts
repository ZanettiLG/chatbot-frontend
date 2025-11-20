// Engine Socket.IO agnóstica (sem Redux, sem React)
import { MessageEngine, EngineConfig, ConnectionStatus, MessageProtocol } from '../types';
import { createSystemMessage } from '../protocol-builder';
import { io, Socket } from 'socket.io-client';

type MessageHandler = (protocol: MessageProtocol) => void;
type StatusChangeHandler = (status: ConnectionStatus) => void;

export class SocketIOEngine implements MessageEngine {
  private socket: Socket | null = null;
  private messageHandlers: Set<MessageHandler> = new Set();
  private statusHandlers: Set<StatusChangeHandler> = new Set();
  private config: Required<EngineConfig> | null = null;
  private status: ConnectionStatus = {
    isConnected: false,
    isConnecting: false,
    error: null,
    lastActivity: null,
  };
  private reconnectAttempts = 0;
  private isManualClose = false;

  constructor(config: EngineConfig) {
    this.config = {
      url: config.url,
      reconnectInterval: config.reconnectInterval || 5000,
      maxReconnectAttempts: config.maxReconnectAttempts || 10,
      autoConnect: config.autoConnect ?? true,
    };

    if (this.config.autoConnect) {
      this.connect();
    }
  }

  public async connect(): Promise<void> {
    if (!this.config) {
      throw new Error('Engine não foi inicializado com configuração');
    }

    // Se já está conectado, não fazer nada
    if (this.socket?.connected) {
      console.log('Socket.IO já está conectado');
      return;
    }

    // Se já existe uma conexão (mesmo que não conectada), não criar nova
    if (this.socket && !this.socket.connected) {
      console.log('Socket.IO já existe, aguardando conexão...');
      return;
    }

    this.isManualClose = false;
    console.log('🔌 Iniciando conexão Socket.IO...');

    try {
      // Configurar Socket.IO
      const socketOptions = {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: this.config.reconnectInterval,
        reconnectionAttempts: this.config.maxReconnectAttempts,
      };

      this.socket = io(this.config.url, socketOptions);

      this.updateStatus({
        isConnecting: true,
        error: null,
      });

      this.socket.on('connect', () => {
        console.log('✅ Socket.IO conectado com sucesso', this.socket?.id);
        this.reconnectAttempts = 0;
        this.updateStatus({
          isConnected: true,
          isConnecting: false,
          error: null,
          lastActivity: new Date().toISOString(),
        });
        if (this.socket) {
          this.notifyMessage(createSystemMessage('connection:open', {}));
        }
      });

      this.socket.on('disconnect', (reason) => {
        console.log('🔌 Socket.IO desconectado:', reason);
        this.updateStatus({
          isConnected: false,
          isConnecting: false,
        });
        this.notifyMessage(createSystemMessage('connection:close', { reason }));

        // Tentar reconectar se não foi fechamento manual
        if (!this.isManualClose && reason === 'io server disconnect') {
          this.socket?.connect();
        }
      });

      this.socket.on('connect_error', (error) => {
        console.error('❌ Erro de conexão Socket.IO:', error);
        this.reconnectAttempts++;
        this.updateStatus({
          error: error.message,
          isConnected: false,
          isConnecting: false,
        });

        if (this.config && this.reconnectAttempts >= this.config.maxReconnectAttempts) {
          console.error('❌ Máximo de tentativas de reconexão atingido');
        }
      });

      // Escutar mensagens do servidor
      this.socket.on('message', (data: any) => {
        this.handleMessage(data);
      });

      // Escutar eventos de sistema
      this.socket.on('connection:open', (data: any) => {
        console.log('🎉 Conexão estabelecida:', data);
        this.updateStatus({
          isConnected: true,
          lastActivity: new Date().toISOString(),
        });
      });

      this.socket.on('connection:close', (data: any) => {
        console.log('🔴 Conexão fechada:', data);
        this.updateStatus({
          isConnected: false,
        });
      });

      this.socket.on('error:occurred', (data: any) => {
        console.error('❌ Erro no Socket.IO:', data);
        this.notifyMessage(createSystemMessage('error:occurred', { error: data }));
      });

    } catch (error) {
      console.error('❌ Erro ao criar conexão Socket.IO:', error);
      this.updateStatus({
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        isConnected: false,
        isConnecting: false,
      });
    }
  }

  public disconnect(): void {
    this.isManualClose = true;
    
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.updateStatus({
      isConnected: false,
      isConnecting: false,
    });
  }

  public sendMessage(
    content: string, 
    type: 'text' | 'image' | 'audio' | 'video' = 'text',
    agentId?: string
  ): void {
    if (!this.socket || !this.socket.connected) {
      console.error('❌ Socket.IO não está conectado');
      return;
    }

    // Criar mensagem no formato esperado pelo servidor NestJS
    // O servidor espera o evento 'message' com dados no formato MessageProtocol
    const message: any = {
      route: 'chat',
      action: 'message:send',
      data: {
        content,
        type,
        timestamp: new Date().toISOString(),
      },
      source: 'websocket',
    };

    // Adicionar agentId se fornecido
    if (agentId) {
      message.agentId = agentId;
      message.data.agentId = agentId;
    }

    try {
      this.socket.emit('message', message);
      console.log('📤 Mensagem enviada:', message);
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem:', error);
    }
  }

  public isConnected(): boolean {
    return this.socket?.connected || false;
  }

  public getStatus(): ConnectionStatus {
    return { ...this.status };
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

  private handleMessage(data: any): void {
    console.log('📨 Mensagem recebida do Socket.IO:', data);

    // Transformar mensagem do servidor em MessageProtocol
    let protocol: MessageProtocol | null = null;

    // O servidor pode enviar o protocolo completo ou apenas os dados
    if (data.route && data.action) {
      // Se vier com protocolo completo
      protocol = {
        id: data.id || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        route: data.route,
        action: data.action,
        data: data.data || data,
        timestamp: data.timestamp || new Date().toISOString(),
        source: data.source || 'websocket',
        sessionId: data.sessionId, // IMPORTANTE: Preservar sessionId do protocolo
      };
    } else if (data.data) {
      // Se vier com estrutura { data: {...} }
      protocol = {
        id: data.id || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        route: 'chat',
        action: 'message:received',
        data: data.data,
        timestamp: data.timestamp || new Date().toISOString(),
        source: data.source || 'websocket', // IMPORTANTE: Preservar source do backend
        sessionId: data.sessionId, // IMPORTANTE: Preservar sessionId do protocolo
      };
    } else {
      // Se vier direto, criar protocolo padrão
      protocol = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        route: 'chat',
        action: 'message:received',
        data: data,
        timestamp: new Date().toISOString(),
        source: data.source || 'websocket', // IMPORTANTE: Preservar source do backend
        sessionId: data.sessionId, // IMPORTANTE: Preservar sessionId do protocolo
      };
    }

    if (protocol) {
      this.updateStatus({
        lastActivity: new Date().toISOString(),
      });
      this.notifyMessage(protocol);
    }
  }

  private updateStatus(updates: Partial<ConnectionStatus>): void {
    this.status = {
      ...this.status,
      ...updates,
    };
    this.notifyStatusChange();
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

