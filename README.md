# 🤖 Chatbot Frontend

Interface web moderna para o Chatbot Multi-Engine desenvolvida com React, Redux, TypeScript e Material-UI (MUI).

## 🚀 Características

- **⚛️ React 18**: Interface moderna e responsiva
- **🔄 Redux Toolkit**: Gerenciamento de estado previsível
- **📘 TypeScript**: Tipagem forte e desenvolvimento seguro
- **🎨 Material-UI**: Interface moderna e profissional com MUI v5
- **🌙 Tema Escuro/Claro**: Alternância entre temas
- **📱 Responsivo**: Funciona perfeitamente em desktop e mobile
- **🔌 WebSocket**: Comunicação em tempo real com o backend
- **📊 Dashboard**: Monitoramento de engines e mensagens
- **🎯 Bottom Navigation**: Navegação intuitiva para mobile

## 🏗️ Arquitetura

```
📁 Frontend
├── 🎯 Components (Componentes React)
│   ├── ChatInterface
│   ├── EngineStatus
│   ├── MessageList
│   └── Settings
├── 🗃️ Store (Redux)
│   ├── chatSlice
│   ├── engineSlice
│   └── uiSlice
├── 🔌 Services (Comunicação)
│   ├── websocketService
│   └── apiService
└── 🎨 Styles (CSS/SCSS)
```

## 📦 Instalação

```bash
# Clone o repositório
git clone <repository-url>
cd chatbot-frontend

# Instale as dependências
npm install

# Execute em modo desenvolvimento
npm start
```

## 🛠️ Scripts Disponíveis

```bash
# Desenvolvimento
npm start          # Executa em modo desenvolvimento
npm run build      # Cria build de produção
npm test           # Executa testes
npm run eject      # Ejecta configuração (irreversível)

# Qualidade de Código
npm run lint       # Executa ESLint
npm run format     # Formata código com Prettier
```

## 🔌 Integração com Backend

O frontend se comunica com o backend através de:

- **WebSocket**: Para mensagens em tempo real
- **REST API**: Para configurações e dados estáticos
- **Event System**: Para sincronização de estado

### Configuração de Conexão

```typescript
// Configuração do WebSocket
const wsConfig = {
  url: 'ws://localhost:3000',
  reconnectInterval: 5000,
  maxReconnectAttempts: 10
};

// Configuração da API
const apiConfig = {
  baseURL: 'http://localhost:3000/api',
  timeout: 10000
};
```

## 🎨 Componentes Principais

### ChatInterface
Interface principal de chat com suporte a:
- Mensagens em tempo real
- Múltiplas engines (WebSocket, WhatsApp)
- Upload de arquivos
- Emojis e formatação

### EngineStatus
Monitoramento de status das engines:
- Status de conexão
- Estatísticas de mensagens
- Configurações de engines

### MessageList
Lista de mensagens com:
- Histórico de conversas
- Filtros por engine
- Busca de mensagens
- Paginação

## 🧪 Testes

```bash
# Executar todos os testes
npm test

# Testes em modo watch
npm run test:watch

# Cobertura de testes
npm run test:coverage
```

## 📱 Responsividade

O frontend é totalmente responsivo e funciona em:
- **Desktop**: Interface completa com sidebar
- **Tablet**: Layout adaptado
- **Mobile**: Interface otimizada para touch

## 🎯 Roadmap

- [ ] Implementação completa dos componentes
- [ ] Integração com WebSocket
- [ ] Dashboard de monitoramento
- [ ] Configurações de engines
- [ ] Temas e personalização
- [ ] Testes automatizados
- [ ] PWA (Progressive Web App)
- [ ] Notificações push

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

---

**Desenvolvido com ❤️ usando React, Redux e TypeScript**