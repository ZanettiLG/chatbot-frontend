import { io, Socket } from 'socket.io-client';
import { store } from '../store';
import { 
  addMessage, 
  setConnectionStatus, 
  setCurrentEngine 
} from '../store/chatSlice';
import { 
  updateEngineStatus, 
  incrementMessageCount 
} from '../store/engineSlice';
import { Message } from '../store/chatSlice';
import config from '../config/env';

interface SocketIOConfig {
  url: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  sessionId?: string;
}

class SocketIOService {
  private socket: Socket | null = null;
  private config: Required<Omit<SocketIOConfig, 'sessionId'>> & { sessionId?: string };
  private reconnectAttempts = 0;
  private isManualClose = false;

  constructor(config: SocketIOConfig) {
    this.config = {
      url: config.url,
      reconnectInterval: config.reconnectInterval || 5000,
      maxReconnectAttempts: config.maxReconnectAttempts || 10,
      sessionId: config.sessionId,
    };
  }

  public connect(): void {
    if (this.socket?.connected) {
      console.log('Socket.IO já está conectado');
      return;
    }

    this.isManualClose = false;
    console.log(`🔌 Conectando ao Socket.IO: ${this.config.url}`);

    try {
      // Configurar Socket.IO com opções
      const socketOptions = {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: this.config.reconnectInterval,
        reconnectionAttempts: this.config.maxReconnectAttempts,
        query: this.config.sessionId ? { sessionId: this.config.sessionId } : {},
      };

      this.socket = io(this.config.url, socketOptions);

      this.socket.on('connect', () => {
        console.log('✅ Socket.IO conectado com sucesso', this.socket?.id);
        this.reconnectAttempts = 0;
        store.dispatch(setConnectionStatus(true));
        store.dispatch(setCurrentEngine('websocket'));
        store.dispatch(updateEngineStatus({
          engine: 'websocket',
          status: {
            isConnected: true,
            lastActivity: new Date().toISOString(),
          },
        }));
      });

      this.socket.on('disconnect', (reason) => {
        console.log('🔌 Socket.IO desconectado:', reason);
        store.dispatch(setConnectionStatus(false));
        store.dispatch(updateEngineStatus({
          engine: 'websocket',
          status: {
            isConnected: false,
          },
        }));

        // Tentar reconectar se não foi fechamento manual
        if (!this.isManualClose && reason === 'io server disconnect') {
          // Servidor desconectou, tentar reconectar
          this.socket?.connect();
        }
      });

      this.socket.on('connect_error', (error) => {
        console.error('❌ Erro de conexão Socket.IO:', error);
        this.reconnectAttempts++;
        
        if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
          console.error('❌ Máximo de tentativas de reconexão atingido');
          store.dispatch(setConnectionStatus(false));
        }
      });

      // Escutar mensagens do servidor
      this.socket.on('message', (data: any) => {
        this.handleMessage(data);
      });

      // Escutar eventos de sistema
      this.socket.on('connection:open', (data: any) => {
        console.log('🎉 Conexão estabelecida:', data);
        store.dispatch(setConnectionStatus(true));
      });

      this.socket.on('connection:close', (data: any) => {
        console.log('🔴 Conexão fechada:', data);
        store.dispatch(setConnectionStatus(false));
      });

      this.socket.on('error:occurred', (data: any) => {
        console.error('❌ Erro no Socket.IO:', data);
      });

    } catch (error) {
      console.error('❌ Erro ao criar conexão Socket.IO:', error);
    }
  }

  private handleMessage(data: any): void {
    console.log('📨 Mensagem recebida do Socket.IO:', data);

    // O servidor pode enviar o protocolo completo ou apenas os dados
    let messageData: any;
    
    if (data.protocol) {
      // Se vier com protocolo completo
      messageData = data.protocol.data || data.protocol;
    } else if (data.data) {
      // Se vier com estrutura { data: {...} }
      messageData = data.data;
    } else {
      // Se vier direto
      messageData = data;
    }

    // Criar mensagem para o Redux
    const message: Message = {
      id: messageData.id || data.id || Date.now().toString(),
      content: messageData.content || messageData.body || '',
      timestamp: messageData.timestamp 
        ? (typeof messageData.timestamp === 'string' 
            ? messageData.timestamp 
            : new Date(messageData.timestamp).toISOString())
        : new Date().toISOString(),
      source: 'websocket',
      userId: messageData.userId,
      type: messageData.type || 'text',
    };

    store.dispatch(addMessage(message));
    store.dispatch(incrementMessageCount('websocket'));
    store.dispatch(updateEngineStatus({
      engine: 'websocket',
      status: {
        lastActivity: new Date().toISOString(),
      },
    }));
  }

  public sendMessage(
    content: string, 
    type: 'text' | 'image' | 'audio' | 'video' = 'text'
  ): void {
    if (!this.socket || !this.socket.connected) {
      console.error('❌ Socket.IO não está conectado');
      return;
    }

    // Criar mensagem no formato esperado pelo servidor
    // O servidor espera o evento 'message' com dados no formato MessageProtocol
    const message = {
      route: 'chat',
      action: 'message:send',
      data: {
        content,
        type,
        timestamp: new Date().toISOString(),
      },
      source: 'websocket',
    };

    try {
      this.socket.emit('message', message);
      console.log('📤 Mensagem enviada:', message);
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem:', error);
    }
  }

  public disconnect(): void {
    this.isManualClose = true;
    
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    store.dispatch(setConnectionStatus(false));
    store.dispatch(setCurrentEngine(null));
    store.dispatch(updateEngineStatus({
      engine: 'websocket',
      status: {
        isConnected: false,
      },
    }));
  }

  public isConnected(): boolean {
    return this.socket?.connected || false;
  }

  public getSessionId(): string | undefined {
    return this.socket?.id;
  }
}

// Criar instância única do serviço
// Socket.IO usa HTTP/HTTPS para handshake, não WebSocket direto
// O Socket.IO automaticamente adiciona /socket.io/ ao path
export const socketioService = new SocketIOService({
  url: config.wsUrl.replace('wss://', 'https://').replace('ws://', 'http://').replace('/ws', ''),
  reconnectInterval: 5000,
  maxReconnectAttempts: 10,
});

export default socketioService;

