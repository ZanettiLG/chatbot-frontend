// Factory para criar engines (Strategy Pattern)
import { MessageEngine, EngineConfig } from './types';
import { SocketIOEngine } from './socketio/socketio-engine';
// import { WebSocketEngine } from './websocket/websocket-engine'; // WebSocket nativo (legado)
// import { WhatsAppEngine } from './whatsapp/whatsapp-engine'; // Futuro

export const createEngine = (
  type: 'websocket' | 'whatsapp',
  config: EngineConfig
): MessageEngine => {
  switch (type) {
    case 'websocket':
      // Usar Socket.IO para conectar com o servidor NestJS
      return new SocketIOEngine(config);
    // case 'whatsapp':
    //   return new WhatsAppEngine(config);
    default:
      throw new Error(`Engine type ${type} não é suportado`);
  }
};

