// Singleton para manter uma única instância da engine (compartilhada entre componentes)
import { MessageEngine, EngineConfig } from './types';
import { createEngine } from './factory';
import config from '../config/env';

class EngineInstanceManager {
  private engine: MessageEngine | null = null;
  private referenceCount = 0;

  /**
   * Obtém ou cria a instância única da engine
   */
  getInstance(configOverride?: Partial<EngineConfig>): MessageEngine {
    if (!this.engine) {
      this.engine = createEngine('websocket', {
        url: config.wsUrl,
        reconnectInterval: 5000,
        maxReconnectAttempts: 10,
        autoConnect: true,
        ...configOverride,
      });
    }
    return this.engine;
  }

  /**
   * Incrementa o contador de referências
   */
  addReference(): void {
    this.referenceCount++;
  }

  /**
   * Decrementa o contador de referências
   * Se chegar a zero, desconecta a engine (mas mantém a instância)
   */
  removeReference(): void {
    this.referenceCount = Math.max(0, this.referenceCount - 1);
    
    // Não desconectamos automaticamente para manter a conexão ativa
    // A engine será desconectada apenas quando o app for desmontado
  }

  /**
   * Desconecta e limpa a engine
   */
  destroy(): void {
    if (this.engine) {
      this.engine.disconnect();
      this.engine = null;
      this.referenceCount = 0;
    }
  }

  /**
   * Retorna a instância atual (pode ser null)
   */
  getCurrentInstance(): MessageEngine | null {
    return this.engine;
  }

  /**
   * Retorna o número de referências ativas
   */
  getReferenceCount(): number {
    return this.referenceCount;
  }
}

// Exportar instância única
export const engineInstance = new EngineInstanceManager();

