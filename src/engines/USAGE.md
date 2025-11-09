# 📖 Guia de Uso - Sistema de Engines

## 🎯 Visão Geral

O sistema de engines foi projetado para ser **flexível**, **agnóstico** e **testável**. Cada componente pode definir seus próprios handlers para processar protocolos de forma diferente.

## 🔌 Instância Única

A engine é mantida em uma **instância única compartilhada** usando `useRef`, não no Redux. Isso garante:
- ✅ Não há objetos não serializáveis no Redux
- ✅ Uma única conexão WebSocket para toda a aplicação
- ✅ Gerenciamento eficiente de recursos

## 📝 Exemplos de Uso

### Uso Básico (com Redux automático)

```typescript
import { useWebSocket } from '../hooks/useWebSocket';

const MyComponent = () => {
  // O Redux adapter processa mensagens automaticamente
  const { sendMessage, isConnected } = useWebSocket();
  
  return (
    <button onClick={() => sendMessage('Olá!')}>
      Enviar
    </button>
  );
};
```

### Uso com Handler Customizado

```typescript
import { useWebSocket } from '../hooks/useWebSocket';
import { MessageProtocol } from '../engines/types';

const ChatComponent = () => {
  // Handler customizado para processar mensagens
  const handleMessage = useCallback((protocol: MessageProtocol) => {
    if (protocol.route === 'chat' && protocol.action === 'message:received') {
      // Processar mensagem de forma customizada
      console.log('Mensagem customizada:', protocol.data);
      
      // Aplicar formatação especial, validações, etc.
      if (protocol.data.content.includes('@admin')) {
        // Notificar admin
      }
    }
  }, []);

  const { sendMessage } = useWebSocket({
    onMessage: handleMessage,
    messageFilter: (protocol) => protocol.route === 'chat',
    handlerPriority: 20, // Alta prioridade (executa antes do Redux)
  });

  return <div>...</div>;
};
```

### Múltiplos Handlers

```typescript
const NotificationComponent = () => {
  const handleNotification = useCallback((protocol: MessageProtocol) => {
    if (protocol.route === 'notification') {
      // Mostrar notificação customizada
      showToast(protocol.data.message);
    }
  }, []);

  const handleCommand = useCallback((protocol: MessageProtocol) => {
    if (protocol.route === 'command') {
      // Executar comando
      executeCommand(protocol.data);
    }
  }, []);

  const { registerHandler } = useWebSocket();

  useEffect(() => {
    const unsub1 = registerHandler(
      (p) => p.route === 'notification',
      handleNotification,
      15
    );
    
    const unsub2 = registerHandler(
      (p) => p.route === 'command',
      handleCommand,
      15
    );

    return () => {
      unsub1();
      unsub2();
    };
  }, [registerHandler, handleNotification, handleCommand]);

  return <div>...</div>;
};
```

### Handler com Prioridade

```typescript
const AdminComponent = () => {
  // Handler de admin (prioridade máxima)
  const handleAdminMessage = useCallback((protocol: MessageProtocol) => {
    // Processar antes de todos os outros handlers
    if (protocol.data.role === 'admin') {
      // Ação especial para admin
    }
  }, []);

  const { sendMessage } = useWebSocket({
    onMessage: handleAdminMessage,
    handlerPriority: 100, // Prioridade máxima
  });

  return <div>...</div>;
};
```

## 🔄 Ordem de Execução

Handlers são executados por **prioridade** (maior primeiro):

1. **Prioridade 100**: Handler de admin
2. **Prioridade 20**: Handler customizado do componente
3. **Prioridade 15**: Handlers adicionais
4. **Prioridade 0**: Redux adapter (padrão)

## 🎨 Padrões de Filtro

### Por Rota

```typescript
messageFilter: (protocol) => protocol.route === 'chat'
```

### Por Ação

```typescript
messageFilter: (protocol) => protocol.action === 'message:received'
```

### Por Rota e Ação

```typescript
messageFilter: (protocol) => 
  protocol.route === 'chat' && 
  protocol.action === 'message:received'
```

### Por Dados

```typescript
messageFilter: (protocol) => 
  protocol.data?.type === 'important'
```

## ⚠️ Boas Práticas

1. **Use `useCallback`** para handlers para evitar re-renders
2. **Sempre limpe handlers** no cleanup do `useEffect`
3. **Use prioridades** para controlar ordem de execução
4. **Mantenha handlers simples** e focados em uma responsabilidade
5. **Não modifique o protocolo** diretamente (crie uma cópia se necessário)

## 🧪 Testando Handlers

```typescript
import { MessageProtocol } from '../engines/types';

test('deve processar mensagem customizada', () => {
  const handler = jest.fn();
  const protocol: MessageProtocol = {
    id: '1',
    route: 'chat',
    action: 'message:received',
    data: { content: 'Teste' },
    timestamp: new Date().toISOString(),
    source: 'websocket',
  };

  handler(protocol);
  
  expect(handler).toHaveBeenCalledWith(protocol);
});
```

## 🔧 Troubleshooting

### Handler não está sendo executado

- Verifique se o `predicate` está correto
- Verifique a prioridade (handlers com prioridade maior executam primeiro)
- Verifique se o handler foi registrado corretamente

### Múltiplas conexões WebSocket

- A engine é uma instância única, mas verifique se não está criando múltiplas instâncias do hook
- Use `engineInstance.getReferenceCount()` para debug

### Redux não está atualizando

- O Redux adapter tem prioridade baixa (0)
- Handlers customizados podem estar interceptando antes
- Verifique se o handler do Redux está registrado

