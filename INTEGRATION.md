# Integração Frontend com Servidor NestJS

## Configuração

O frontend foi atualizado para usar **Socket.IO** ao invés de WebSocket nativo, para conectar com o servidor NestJS.

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz do `frontend` com as seguintes variáveis:

```env
# Socket.IO URL (NestJS server)
VITE_WS_URL=http://localhost:3030

# API REST URL (se necessário)
VITE_API_URL=http://localhost:3030/api
```

### Estrutura

- **Engine Socket.IO**: `src/engines/socketio/socketio-engine.ts`
  - Implementa a interface `MessageEngine`
  - Usa Socket.IO client para conectar com o servidor
  - Processa mensagens no formato `MessageProtocol`

- **Serviço Socket.IO**: `src/services/socketioService.ts`
  - Serviço alternativo (opcional) para uso direto
  - Integrado com Redux

- **Factory**: `src/engines/factory.ts`
  - Atualizada para usar `SocketIOEngine` ao invés de `WebSocketEngine`

### Protocolo de Mensagens

O frontend envia mensagens no formato:

```typescript
{
  route: 'chat',
  action: 'message:send',
  data: {
    content: string,
    type: 'text' | 'image' | 'audio' | 'video',
    timestamp: string
  },
  source: 'websocket'
}
```

O servidor responde com mensagens no formato `MessageProtocol`:

```typescript
{
  id: string,
  route: string,
  action: string,
  data: any,
  timestamp: Date,
  source: string,
  sessionId?: string,
  order?: number
}
```

### Como Usar

O frontend já está configurado para usar Socket.IO automaticamente. Basta:

1. Configurar as variáveis de ambiente no `.env`
2. Iniciar o servidor NestJS na porta 3030
3. Iniciar o frontend: `npm run dev`

A conexão será estabelecida automaticamente quando o componente `ChatInterface` for montado.

### Compatibilidade

- ✅ Mantém compatibilidade com a arquitetura existente
- ✅ Usa a mesma interface `MessageEngine`
- ✅ Integrado com Redux através do adapter
- ✅ Suporta handlers customizados por componente

