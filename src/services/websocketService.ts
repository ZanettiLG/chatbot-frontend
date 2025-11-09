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

interface WebSocketConfig {
  url: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

class WebSocketService {
  private ws: WebSocket | null = null;
  private config: Required<WebSocketConfig>;
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isManualClose = false;

  constructor(config: WebSocketConfig) {
    this.config = {
      url: config.url,
      reconnectInterval: config.reconnectInterval || 5000,
      maxReconnectAttempts: config.maxReconnectAttempts || 10,
    };
  }

  public connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('WebSocket já está conectado');
      return;
    }

    this.isManualClose = false;
    console.log(`🔌 Conectando ao WebSocket: ${this.config.url}`);

    try {
      this.ws = new WebSocket(this.config.url);

      this.ws.onopen = () => {
        console.log('✅ WebSocket conectado com sucesso');
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
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('❌ Erro ao processar mensagem WebSocket:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('❌ Erro no WebSocket:', error);
        store.dispatch(setConnectionStatus(false));
        store.dispatch(updateEngineStatus({
          engine: 'websocket',
          status: {
            isConnected: false,
          },
        }));
      };

      this.ws.onclose = () => {
        console.log('🔌 WebSocket desconectado');
        store.dispatch(setConnectionStatus(false));
        store.dispatch(updateEngineStatus({
          engine: 'websocket',
          status: {
            isConnected: false,
          },
        }));

        // Tentar reconectar se não foi fechamento manual
        if (!this.isManualClose && this.reconnectAttempts < this.config.maxReconnectAttempts) {
          this.scheduleReconnect();
        }
      };
    } catch (error) {
      console.error('❌ Erro ao criar conexão WebSocket:', error);
      this.scheduleReconnect();
    }
  }

  private handleMessage(data: any): void {
    console.log('📨 Mensagem recebida do WebSocket:', data);

    // Processar diferentes tipos de mensagens
    if (data.type === 'message' || data.action === 'message:received') {
      const messageData = data.data || data;
      
      const message: Message = {
        id: messageData.id || Date.now().toString(),
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
    } else if (data.action === 'connection:open') {
      console.log('🎉 Conexão WebSocket estabelecida');
      store.dispatch(setConnectionStatus(true));
    } else if (data.action === 'connection:close') {
      console.log('🔴 Conexão WebSocket fechada');
      store.dispatch(setConnectionStatus(false));
    } else if (data.action === 'error:occurred') {
      console.error('❌ Erro no WebSocket:', data.data);
    }
  }

  public sendMessage(content: string, type: 'text' | 'image' | 'audio' | 'video' = 'text'): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('❌ WebSocket não está conectado');
      return;
    }

    const message = {
      type: 'message',
      data: {
        content,
        type,
        timestamp: new Date().toISOString(),
      },
    };

    try {
      this.ws.send(JSON.stringify(message));
      console.log('📤 Mensagem enviada:', message);
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem:', error);
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.reconnectAttempts++;
    console.log(
      `🔄 Tentando reconectar (${this.reconnectAttempts}/${this.config.maxReconnectAttempts}) em ${this.config.reconnectInterval}ms...`
    );

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, this.config.reconnectInterval);
  }

  public disconnect(): void {
    this.isManualClose = true;
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
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
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// Criar instância única do serviço
export const websocketService = new WebSocketService({
  url: config.wsUrl,
  reconnectInterval: 5000,
  maxReconnectAttempts: 10,
});

export default websocketService;

