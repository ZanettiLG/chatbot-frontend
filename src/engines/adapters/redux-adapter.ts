// Adaptador para conectar engines ao Redux (desacopla engine do store)
// Este adaptador é opcional e pode ser substituído por handlers customizados
import { Store } from '@reduxjs/toolkit';
import { MessageProtocol, ConnectionStatus } from '../types';
import { 
  addMessage, 
  setConnectionStatus, 
  setCurrentEngine 
} from '../../store/chatSlice';
import { 
  updateEngineStatus, 
  incrementMessageCount 
} from '../../store/engineSlice';
import { Message } from '../../store/chatSlice';

export interface ReduxAdapterConfig {
  store: Store;
  engineType: 'websocket' | 'whatsapp';
}

export const createReduxAdapter = (config: ReduxAdapterConfig) => {
  const { store, engineType } = config;

  /**
   * Handler para mensagens de chat (pode ser usado como handler customizado)
   */
  const handleMessage = (protocol: MessageProtocol): void => {
    if (protocol.action === 'message:received' && protocol.route === 'chat') {
      const messageData = protocol.data;
      
      // IMPORTANTE: Usar o source do protocol, não o engineType
      // O backend envia 'system' para respostas do agente e 'websocket' para mensagens do usuário
      const messageSource = protocol.source || engineType;
      
      const message: Message = {
        id: protocol.id,
        content: typeof messageData === 'string' 
          ? messageData 
          : (messageData?.content || messageData?.body || ''),
        timestamp: protocol.timestamp || new Date().toISOString(),
        source: messageSource as 'websocket' | 'whatsapp' | 'system',
        userId: typeof messageData === 'object' ? messageData?.userId : undefined,
        type: typeof messageData === 'object' ? (messageData?.type || 'text') : 'text',
      };

      console.log('📨 [ReduxAdapter] Adicionando mensagem:', {
        id: message.id,
        source: message.source,
        engineType,
        protocolSource: protocol.source,
        hasContent: !!message.content,
      });

      store.dispatch(addMessage(message));
      store.dispatch(incrementMessageCount(engineType));
      store.dispatch(updateEngineStatus({
        engine: engineType,
        status: {
          lastActivity: new Date().toISOString(),
        },
      }));
    }
  };

  /**
   * Handler para mudanças de status
   */
  const handleStatusChange = (status: ConnectionStatus): void => {
    store.dispatch(setConnectionStatus(status.isConnected));
    
    if (status.isConnected) {
      store.dispatch(setCurrentEngine(engineType));
    } else {
      store.dispatch(setCurrentEngine(null));
    }

    store.dispatch(updateEngineStatus({
      engine: engineType,
      status: {
        isConnected: status.isConnected,
        lastActivity: status.lastActivity || undefined,
      },
    }));
  };

  /**
   * Handler para abertura de conexão
   */
  const handleConnectionOpen = (): void => {
    store.dispatch(setConnectionStatus(true));
    store.dispatch(setCurrentEngine(engineType));
    store.dispatch(updateEngineStatus({
      engine: engineType,
      status: {
        isConnected: true,
        lastActivity: new Date().toISOString(),
      },
    }));
  };

  /**
   * Handler para fechamento de conexão
   */
  const handleConnectionClose = (): void => {
    store.dispatch(setConnectionStatus(false));
    store.dispatch(setCurrentEngine(null));
    store.dispatch(updateEngineStatus({
      engine: engineType,
      status: {
        isConnected: false,
      },
    }));
  };

  /**
   * Handler para erros
   */
  const handleError = (_error: any): void => {
    store.dispatch(setConnectionStatus(false));
    store.dispatch(updateEngineStatus({
      engine: engineType,
      status: {
        isConnected: false,
      },
    }));
  };

  return {
    handleMessage,
    handleStatusChange,
    handleConnectionOpen,
    handleConnectionClose,
    handleError,
  };
};
