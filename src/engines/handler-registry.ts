// Sistema de registro de handlers flexível (permite múltiplos handlers por protocolo)
import { MessageProtocol, MessageHandler } from './types';

export type HandlerPredicate = (protocol: MessageProtocol) => boolean;
export type HandlerId = string;

export interface RegisteredHandler {
  id: HandlerId;
  predicate: HandlerPredicate;
  handler: MessageHandler;
  priority?: number; // Handlers com maior prioridade são executados primeiro
}

export class HandlerRegistry {
  private handlers: RegisteredHandler[] = [];
  private nextId = 0;

  /**
   * Registra um handler que será chamado quando o predicate retornar true
   * @param predicate Função que determina se o handler deve ser executado
   * @param handler Função que processa o protocolo
   * @param priority Prioridade do handler (maior = executado primeiro)
   * @returns Função para remover o handler
   */
  register(
    predicate: HandlerPredicate,
    handler: MessageHandler,
    priority: number = 0
  ): () => void {
    const id = `handler_${this.nextId++}`;
    const registered: RegisteredHandler = {
      id,
      predicate,
      handler,
      priority,
    };

    this.handlers.push(registered);
    // Ordenar por prioridade (maior primeiro)
    this.handlers.sort((a, b) => (b.priority || 0) - (a.priority || 0));

    // Retornar função de remoção
    return () => {
      this.handlers = this.handlers.filter(h => h.id !== id);
    };
  }

  /**
   * Registra um handler para uma rota específica
   */
  registerForRoute(
    route: MessageProtocol['route'],
    handler: MessageHandler,
    priority?: number
  ): () => void {
    return this.register(
      (protocol) => protocol.route === route,
      handler,
      priority
    );
  }

  /**
   * Registra um handler para uma ação específica
   */
  registerForAction(
    action: MessageProtocol['action'],
    handler: MessageHandler,
    priority?: number
  ): () => void {
    return this.register(
      (protocol) => protocol.action === action,
      handler,
      priority
    );
  }

  /**
   * Registra um handler para uma combinação de rota e ação
   */
  registerForRouteAndAction(
    route: MessageProtocol['route'],
    action: MessageProtocol['action'],
    handler: MessageHandler,
    priority?: number
  ): () => void {
    return this.register(
      (protocol) => protocol.route === route && protocol.action === action,
      handler,
      priority
    );
  }

  /**
   * Processa um protocolo através de todos os handlers registrados
   */
  process(protocol: MessageProtocol): void {
    const matchingHandlers = this.handlers.filter(h => h.predicate(protocol));
    
    matchingHandlers.forEach(registered => {
      try {
        registered.handler(protocol);
      } catch (error) {
        console.error(`Erro ao executar handler ${registered.id}:`, error);
      }
    });
  }

  /**
   * Remove todos os handlers
   */
  clear(): void {
    this.handlers = [];
  }

  /**
   * Retorna o número de handlers registrados
   */
  getHandlerCount(): number {
    return this.handlers.length;
  }
}

