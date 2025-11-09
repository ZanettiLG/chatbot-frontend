# 🏗️ Arquitetura de Engines - Frontend

## 📋 Visão Geral

Esta arquitetura foi criada para desacoplar as engines de comunicação (WebSocket, WhatsApp, etc.) do Redux e do React, tornando-as **agnósticas** e **testáveis**.

## 🎯 Princípios

1. **Agnosticismo**: Engines não conhecem Redux, React ou qualquer framework
2. **Separação de Responsabilidades**: Cada módulo tem uma única responsabilidade
3. **Composição Funcional**: Uso de funções puras ao invés de classes quando possível
4. **Testabilidade**: Código facilmente testável sem mocks complexos
5. **Extensibilidade**: Fácil adicionar novas engines seguindo o mesmo padrão

## 📁 Estrutura

```
engines/
├── types.ts                    # Tipos e interfaces agnósticas
├── protocol-builder.ts         # Funções puras para criar protocolos
├── factory.ts                  # Factory Pattern para criar engines
├── adapters/
│   └── redux-adapter.ts       # Adaptador para conectar ao Redux
├── websocket/
│   ├── connection.ts          # Lógica pura de conexão
│   ├── reconnection.ts        # Lógica pura de reconexão
│   ├── message-handler.ts     # Transformação de mensagens
│   └── websocket-engine.ts    # Engine WebSocket agnóstica
└── index.ts                    # Exportações públicas
```

## 🔌 Engines

### WebSocketEngine

Engine completamente agnóstica que:
- Gerencia conexão WebSocket
- Processa mensagens recebidas
- Gerencia reconexão automática
- Emite eventos via callbacks (Observer Pattern)

**Não conhece:**
- ❌ Redux
- ❌ React
- ❌ Store

**Conhece apenas:**
- ✅ Protocolo de mensagens
- ✅ Callbacks para eventos

## 🔄 Fluxo de Dados

```
WebSocketEngine (agnóstico)
    ↓ (eventos)
ReduxAdapter (adaptador)
    ↓ (dispatch)
Redux Store
    ↓ (selectors)
React Components
```

## 📝 Exemplo de Uso

### Criando uma Engine

```typescript
import { createEngine } from '../engines/factory';

const engine = createEngine('websocket', {
  url: 'ws://localhost:8080/ws',
  reconnectInterval: 5000,
  maxReconnectAttempts: 10,
  autoConnect: true,
});
```

### Conectando ao Redux

```typescript
import { createReduxAdapter } from '../engines/adapters/redux-adapter';

const adapter = createReduxAdapter({
  store,
  engineType: 'websocket',
});

engine.onMessage((protocol) => {
  adapter.handleMessage(protocol);
});

engine.onStatusChange((status) => {
  adapter.handleStatusChange(status);
});
```

### Usando no Hook React

```typescript
const { sendMessage, isConnected } = useWebSocket();
```

## 🧪 Testabilidade

Como as engines são agnósticas, podem ser testadas sem Redux ou React:

```typescript
import { WebSocketEngine } from '../engines/websocket/websocket-engine';

test('deve conectar ao WebSocket', async () => {
  const engine = new WebSocketEngine({
    url: 'ws://localhost:8080/ws',
  });

  const messages: MessageProtocol[] = [];
  engine.onMessage((protocol) => {
    messages.push(protocol);
  });

  await engine.connect();
  // Testar sem precisar de Redux!
});
```

## 🔧 Padrões de Design Utilizados

1. **Strategy Pattern**: `createEngine()` cria diferentes engines
2. **Observer Pattern**: `onMessage()` e `onStatusChange()` para eventos
3. **Adapter Pattern**: `ReduxAdapter` conecta engine ao Redux
4. **Factory Pattern**: `createEngine()` para criar engines
5. **Composition**: Funções puras compostas para criar funcionalidades

## 🚀 Adicionando Nova Engine

1. Criar pasta `engines/whatsapp/`
2. Implementar interface `MessageEngine`
3. Adicionar ao `factory.ts`
4. Criar adaptador se necessário (ou reutilizar ReduxAdapter)

## ✅ Benefícios

- ✅ **Desacoplamento**: Engines não dependem de Redux
- ✅ **Testabilidade**: Fácil testar sem mocks complexos
- ✅ **Reutilização**: Engines podem ser usadas em outros contextos
- ✅ **Manutenibilidade**: Código organizado e fácil de entender
- ✅ **Extensibilidade**: Fácil adicionar novas engines

