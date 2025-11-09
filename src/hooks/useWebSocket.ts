import { useEffect, useCallback, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { MessageEngine, ConnectionStatus, MessageProtocol, MessageHandler } from '../engines/types';
import { engineInstance } from '../engines/engine-instance';
import { HandlerRegistry } from '../engines/handler-registry';
import { createReduxAdapter } from '../engines/adapters/redux-adapter';
import { store } from '../store';

export interface UseWebSocketOptions {
  /**
   * Handler customizado para processar protocolos
   * Permite que cada componente defina como processar mensagens
   */
  onMessage?: MessageHandler;
  
  /**
   * Predicado para filtrar quais protocolos o handler deve processar
   * Se não fornecido, processa todos os protocolos
   */
  messageFilter?: (protocol: MessageProtocol) => boolean;
  
  /**
   * Prioridade do handler (maior = executado primeiro)
   */
  handlerPriority?: number;
  
  /**
   * Se deve conectar automaticamente
   */
  autoConnect?: boolean;
}

export const useWebSocket = (options: UseWebSocketOptions = {}) => {
  const { isConnected, currentEngine } = useSelector((state: RootState) => state.chat);
  const engineRef = useRef<MessageEngine | null>(null);
  const handlerRegistryRef = useRef<HandlerRegistry | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>({
    isConnected: false,
    isConnecting: false,
    error: null,
    lastActivity: null,
  });

  // Usar refs para opções para evitar re-execução do useEffect
  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  useEffect(() => {
    // Obter instância única da engine (compartilhada)
    const engine = engineInstance.getInstance();
    engineInstance.addReference();
    engineRef.current = engine;

    // Criar registry de handlers (uma instância por hook)
    const registry = new HandlerRegistry();
    handlerRegistryRef.current = registry;

    // Criar adaptador Redux (opcional, para manter compatibilidade)
    const adapter = createReduxAdapter({
      store,
      engineType: 'websocket',
    });

    // Registrar handler padrão do Redux (baixa prioridade) - apenas uma vez
    const unsubRedux = registry.registerForRouteAndAction(
      'chat',
      'message:received',
      (protocol) => {
        adapter.handleMessage(protocol);
      },
      0 // Prioridade baixa
    );

    // Handler principal que processa todos os protocolos através do registry
    const unsubscribeMessage = engine.onMessage((protocol) => {
      registry.process(protocol);
    });

    // Handler de status
    const unsubscribeStatus = engine.onStatusChange((newStatus) => {
      setStatus(newStatus);
      adapter.handleStatusChange(newStatus);
    });

    // Conectar apenas se ainda não estiver conectado
    if (optionsRef.current.autoConnect !== false && !engine.isConnected()) {
      engine.connect();
    }

    // Cleanup
    return () => {
      unsubscribeMessage();
      unsubscribeStatus();
      unsubRedux();
      registry.clear();
      engineInstance.removeReference();
    };
  }, []); // Executar apenas uma vez na montagem

  // Registrar/atualizar handler customizado quando mudar (sem recriar conexão)
  const customHandlerRef = useRef<(() => void) | null>(null);
  useEffect(() => {
    if (!handlerRegistryRef.current) return;

    const registry = handlerRegistryRef.current;
    
    // Remover handler anterior se existir
    if (customHandlerRef.current) {
      customHandlerRef.current();
      customHandlerRef.current = null;
    }
    
    // Registrar novo handler se fornecido
    if (options.onMessage) {
      const predicate = options.messageFilter || (() => true);
      customHandlerRef.current = registry.register(
        predicate,
        options.onMessage,
        options.handlerPriority ?? 10
      );
    }
  }, [options.onMessage, options.messageFilter, options.handlerPriority]);

  const sendMessage = useCallback((content: string, type: 'text' | 'image' | 'audio' | 'video' = 'text', agentId?: string) => {
    engineRef.current?.sendMessage(content, type, agentId);
  }, []);

  const connect = useCallback(() => {
    engineRef.current?.connect();
  }, []);

  const disconnect = useCallback(() => {
    engineRef.current?.disconnect();
  }, []);

  /**
   * Registra um handler adicional dinamicamente
   */
  const registerHandler = useCallback((
    predicate: (protocol: MessageProtocol) => boolean,
    handler: MessageHandler,
    priority?: number
  ) => {
    if (handlerRegistryRef.current) {
      return handlerRegistryRef.current.register(predicate, handler, priority);
    }
    return () => {}; // No-op se registry não existe
  }, []);

  return {
    isConnected: status.isConnected || isConnected,
    status,
    currentEngine,
    sendMessage,
    connect,
    disconnect,
    registerHandler,
    engine: engineRef.current, // Expor engine para casos avançados
  };
};

