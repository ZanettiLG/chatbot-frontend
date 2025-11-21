import React, { 
  useRef,
  useMemo,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import SendIcon from '@mui/icons-material/Send';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import EmojiIcon from '@mui/icons-material/EmojiEmotions';
import AttachFileIcon from '@mui/icons-material/AttachFile';

import { RootState } from '../../store';
import { Message } from '../../store/chatSlice';
import { addMessage } from '../../store/chatSlice';
import { fetchRoles } from '../../store/roleSlice';
import ChatMessage from '../components/ChatMessage';
import { MessageProtocol } from '../../engines/types';
import Conditional from '../../components/Conditional';
import { useWebSocket } from '../../hooks/useWebSocket';
import { selectAgent, fetchAgents } from '../../store/agentSlice';
import { fetchPersonalities } from '../../store/personalitySlice';
import { fetchConversationState } from '../../store/conversationStateSlice';

interface ChatHeaderProps {
  roles: Role[];
  agents: Agent[];
  isConnected: boolean;
  personalities: Personality[];
  selectedAgentId: string | null;
  handleAgentChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const ChatHeader = React.memo<ChatHeaderProps>(({ 
  roles,
  agents,
  isConnected,
  personalities,
  selectedAgentId,
  handleAgentChange,
}: ChatHeaderProps) => (
    <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" component="h2">
          Conversa com o Agente
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Chip
            label={isConnected ? 'Conectado' : 'Desconectado'}
            color={isConnected ? 'success' : 'error'}
            variant="outlined"
          />
        </Box>
      </Box>
      <FormControl fullWidth size="small">
        <InputLabel>Selecionar Agente</InputLabel>
        <Select
          value={selectedAgentId || ''}
          onChange={handleAgentChange}
          label="Selecionar Agente"
          disabled={!isConnected}
        >
          <MenuItem value="">
            <em>Nenhum (padrão)</em>
          </MenuItem>
          {agents.filter(a => a.isActive).map((agent) => {
            const role = roles.find((r) => r.id === agent.roleId);
            const personality = personalities.find((p) => p.id === agent.personalityId);
            return (
              <MenuItem key={agent.id} value={agent.id}>
                {agent.name} - {role?.name || 'Sem role'} ({personality?.name || 'Sem personalidade'})
              </MenuItem>
            );
          })}
        </Select>
      </FormControl>
      {selectedAgentId && (() => {
        const selectedAgent = agents.find(a => a.id === selectedAgentId);
        const selectedRole = roles.find((r) => r.id === selectedAgent?.roleId);
        const selectedPersonality = personalities.find((p) => p.id === selectedAgent?.personalityId);
        return selectedAgent ? (
          <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip
              label={selectedAgent.name}
              size="small"
              color="primary"
              variant="outlined"
            />
            {selectedRole && (
              <Chip
                label={`Role: ${selectedRole.name}`}
                size="small"
                color="secondary"
                variant="outlined"
              />
            )}
            {selectedPersonality && (
              <Chip
                label={`Personalidade: ${selectedPersonality.name}`}
                size="small"
                color="secondary"
                variant="outlined"
              />
            )}
          </Box>
        ) : null;
      })()}
    </Paper>
));
ChatHeader.displayName = 'ChatHeader';

interface ChatInputProps {
  isConnected: boolean;
  inputMessage: string;
  setInputMessage: (value: string) => void;
  handleSendMessage: () => void;
  handleKeyPress: (e: React.KeyboardEvent) => void;
}

const ChatInput = React.memo<ChatInputProps>(({
  isConnected,
  inputMessage,
  handleKeyPress,
  setInputMessage,
  handleSendMessage,
}: ChatInputProps) => (
  <Paper elevation={2} sx={{ p: 2 }}>
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
      <TextField
        fullWidth
        multiline
        maxRows={4}
        value={inputMessage}
        onChange={(e) => setInputMessage(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="Digite sua mensagem..."
        disabled={!isConnected}
        variant="outlined"
        size="small"
      />
      <Tooltip title="Anexar arquivo">
        <IconButton disabled={!isConnected}>
          <AttachFileIcon />
        </IconButton>
      </Tooltip>
      <Tooltip title="Emoji">
        <IconButton disabled={!isConnected}>
          <EmojiIcon />
        </IconButton>
      </Tooltip>
      <Button
        variant="contained"
        onClick={handleSendMessage}
        disabled={!isConnected || !inputMessage.trim()}
        startIcon={<SendIcon />}
        sx={{ minWidth: 'auto', px: 2 }}
      >
        Enviar
      </Button>
    </Box>
  </Paper>
));
ChatInput.displayName = 'ChatInput';

interface ChatMessagesProps {
  messages: Message[];
  isWaitingResponse: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  messagesContainerRef: React.RefObject<HTMLDivElement>;
}

const ChatMessages = React.memo<ChatMessagesProps>(({
  messages,
  messagesEndRef,
  isWaitingResponse,
  messagesContainerRef,
}: ChatMessagesProps) => {

  const messageComponents = useMemo(() => {
    return messages.map((message) => {
      const key = message.id || `message-${Date.now()}`;
      const isUser = message.source === 'websocket';
      const author: ChatAuthorProps = {
        name: message.source,
        type: isUser ? 'user' : 'agent',
      };

      return (
        <ChatMessage
          key={key}
          author={author}
          message={message}
          align={isUser ? 'right' : 'left'}
        />
      );
    });
  }, [messages]);

  return (
    <Paper
      elevation={1}
      sx={{
        flex: 1,
        overflow: 'auto',
        p: 2,
        mb: 2,
        maxHeight: 'calc(100vh - 300px)',
      }}
      ref={messagesContainerRef}
    >
      <Box>
        {messageComponents}
        <Conditional condition={isWaitingResponse}>
          <ChatMessage
            key={`waiting-response-${Date.now()}`}
            author={{ name: 'Agente', type: 'agent' }}
            message={{
              id: `waiting-response-${Date.now()}`,
              content: '...',
              timestamp: new Date().toISOString(),
              source: 'agent',
              userId: 'agent',
              type: 'text',
            }}
            align="left"
          />
        </Conditional>
        <div ref={messagesEndRef} />
      </Box>
    </Paper>
  );
});
ChatMessages.displayName = 'ChatMessages';

const ChatInterface: React.FC = () => {
  const dispatch = useDispatch();
  const { agentId } = useParams();
  
  const { roles } = useSelector((state: RootState) => state.role);
  const { personalities } = useSelector((state: RootState) => state.personality);
  const { messages, isConnected, isWaitingResponse } = useSelector((state: RootState) => state.chat);
  const { agents, selectedAgentId } = useSelector((state: RootState) => state.agent);

  const [inputMessage, setInputMessage] = useState('');
  
  const previousMessageCountRef = useRef<number>(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastMessageIdRef = useRef<string | null>(null);
  const previousMessagesIdsStringRef = useRef<string>('');
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Handler customizado para processar mensagens de chat
  // Este handler tem prioridade alta e processa antes do Redux
  const handleChatMessage = useCallback((protocol: MessageProtocol) => {
    // Processar apenas mensagens de chat recebidas
    if (protocol.route === 'chat' && protocol.action === 'message:received') {
      const messageData = protocol.data;
      console.log('📨 Mensagem processada no ChatInterface:', messageData);
      
      // Aqui você pode processar a mensagem de forma diferente
      // Por exemplo, aplicar formatação especial, validações, etc.
      
      // O Redux adapter ainda vai processar depois (prioridade menor)
      // Mas você pode interceptar e modificar antes se necessário
    }
  }, []);

  // Handler para outros tipos de protocolos (notificações, comandos, etc.)
  const handleOtherProtocols = useCallback((protocol: MessageProtocol) => {
    if (protocol.route === 'notification') {
      console.log('🔔 Notificação recebida:', protocol.data);
      // Processar notificações de forma diferente
    } else if (protocol.route === 'command') {
      console.log('⚙️ Comando recebido:', protocol.data);
      // Processar comandos de forma diferente
    }
  }, []);

  const { sendMessage, registerHandler } = useWebSocket({
    onMessage: handleChatMessage,
    messageFilter: (protocol) => protocol.route === 'chat',
    handlerPriority: 20, // Alta prioridade
  });

  // Registrar handler adicional para outros protocolos
  useEffect(() => {
    const unsubscribe = registerHandler(
      (protocol) => protocol.route !== 'chat',
      handleOtherProtocols,
      15
    );
    return unsubscribe;
  }, [registerHandler, handleOtherProtocols]);

  // Scroll automático apenas quando há novas mensagens
  // Criar string de IDs para comparação estável
  const messagesIdsString = useMemo(() => {
    if (!messages || messages.length === 0) {
      return '';
    }
    return messages.map(m => m?.id || '').filter(id => id).join(',');
  }, [messages]);
  
  useEffect(() => {
    // Verificar se há mensagens válidas
    if (!messages || messages.length === 0) {
      // Se não há mensagens, resetar contadores mas não fazer scroll
      previousMessageCountRef.current = 0;
      lastMessageIdRef.current = null;
      previousMessagesIdsStringRef.current = '';
      return;
    }
    
    // Comparar strings de IDs em vez de referências de array
    const hasChanged = messagesIdsString !== previousMessagesIdsStringRef.current;
    
    if (!hasChanged) {
      // Se os IDs não mudaram, não há novas mensagens - não fazer nada
      return;
    }
    
    // IDs mudaram - verificar se é realmente uma nova mensagem
    const currentMessageCount = messages.length;
    const previousMessageCount = previousMessageCountRef.current;
    const hasNewMessages = currentMessageCount > previousMessageCount;
    
    // Verificar se a última mensagem mudou (nova mensagem adicionada)
    const lastMessage = messages[messages.length - 1];
    const lastMessageId = lastMessage?.id || null;
    const isNewMessage = lastMessageId !== lastMessageIdRef.current;
    
    // Atualizar referências
    previousMessageCountRef.current = currentMessageCount;
    lastMessageIdRef.current = lastMessageId;
    previousMessagesIdsStringRef.current = messagesIdsString;
    
    // Só fazer scroll se:
    // 1. Houver novas mensagens (contagem aumentou)
    // 2. OU a última mensagem mudou (nova mensagem adicionada)
    // 3. E o usuário está próximo do final da lista (dentro de 100px do final)
    if ((hasNewMessages || isNewMessage) && messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      const isNearBottom = 
        container.scrollHeight - container.scrollTop - container.clientHeight < 100;
      
      // Só fazer scroll se estiver próximo do final ou se for a primeira carga
      if (isNearBottom || previousMessageCount === 0) {
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
  }, [messagesIdsString, messages]);

  useEffect(() => {
    if (agentId) {
      dispatch(selectAgent(agentId));
    }
  }, [agentId, dispatch]);

  // Carregar agentes, roles e personalidades ao montar componente
  useEffect(() => {
    dispatch(fetchAgents(true)); // Carregar apenas agentes ativos
    dispatch(fetchRoles({ activeOnly: true }));
    dispatch(fetchPersonalities({ activeOnly: true }));
  }, [dispatch]);

  // Polling para atualizar ConversationState
  useEffect(() => {
    if (!selectedAgentId) return;

    // Usar selectedAgentId como sessionId temporário
    // Em produção, isso deveria vir do backend ou ser persistido
    const sessionId = selectedAgentId || `session_${Date.now()}`;
    
    const fetchState = () => {
      dispatch(fetchConversationState(sessionId));
    };

    // Buscar imediatamente
    fetchState();

    // Polling a cada 5 segundos
    const interval = setInterval(fetchState, 5000);

    return () => clearInterval(interval);
  }, [selectedAgentId, dispatch]);

  // Atualizar quando nova mensagem chegar
  useEffect(() => {
    if (selectedAgentId && messages.length > 0) {
      const sessionId = selectedAgentId || `session_${Date.now()}`;
      dispatch(fetchConversationState(sessionId));
    }
  }, [messages.length, selectedAgentId, dispatch]);

  const handleSendMessage = () => {
    if (inputMessage.trim() && isConnected) {
      // Enviar mensagem via WebSocket com agentId se selecionado
      sendMessage(inputMessage, 'text', selectedAgentId || undefined);
      
      // Adicionar mensagem localmente (será atualizada quando a resposta chegar)
      // Mensagem do usuário sempre tem source 'websocket' e userId 'user'
      const newMessage: Message = {
        id: `user_${Date.now()}`,
        content: inputMessage,
        timestamp: new Date().toISOString(),
        source: 'websocket', // Sempre 'websocket' para mensagens do usuário
        userId: 'user', // Identificar como mensagem do usuário
        type: 'text',
      };
      
      dispatch(addMessage(newMessage));
      setInputMessage('');
    }
  };

  const handleAgentChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const agentId = event.target.value === '' ? null : event.target.value;
    dispatch(selectAgent(agentId));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Box sx={{ 
      height: 'calc(100vh - 200px)', 
      display: 'flex', 
      flexDirection: 'column',
      p: { xs: 2, sm: 3, md: 4 },
      maxWidth: '1200px',
      mx: 'auto',
    }}>
      <ChatHeader
        roles={roles}
        agents={agents}
        isConnected={isConnected}
        personalities={personalities}
        selectedAgentId={selectedAgentId}
        handleAgentChange={handleAgentChange}
      />

      {/* Messages */}
      <ChatMessages
        messages={messages}
        messagesEndRef={messagesEndRef}
        isWaitingResponse={isWaitingResponse}
        messagesContainerRef={messagesContainerRef}
      />

      {/* Input */}
      <ChatInput
        isConnected={isConnected}
        inputMessage={inputMessage}
        handleKeyPress={handleKeyPress}
        setInputMessage={setInputMessage}
        handleSendMessage={handleSendMessage}
      />
    </Box>
  );
};

export default ChatInterface;
