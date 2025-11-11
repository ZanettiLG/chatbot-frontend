import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Chip,
  List,
  ListItem,
  Avatar,
  Divider,
  IconButton,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Send as SendIcon,
  AttachFile as AttachFileIcon,
  EmojiEmotions as EmojiIcon,
} from '@mui/icons-material';
import { RootState } from '../store';
import { addMessage } from '../store/chatSlice';
import { Message } from '../store/chatSlice';
import { useWebSocket } from '../hooks/useWebSocket';
import { MessageProtocol } from '../engines/types';
import { selectAgent, fetchAgents } from '../store/agentSlice';
import { fetchRoles } from '../store/roleSlice';
import { fetchPersonalities } from '../store/personalitySlice';
import MarkdownMessage from './MarkdownMessage';

const ChatInterface: React.FC = () => {
  const dispatch = useDispatch();
  const { messages, isConnected, currentEngine } = useSelector((state: RootState) => state.chat);
  const { agents, selectedAgentId } = useSelector((state: RootState) => state.agent);
  const { roles } = useSelector((state: RootState) => state.role);
  const { personalities } = useSelector((state: RootState) => state.personality);
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Carregar agentes, roles e personalidades ao montar componente
  useEffect(() => {
    dispatch(fetchAgents(true) as any); // Carregar apenas agentes ativos
    dispatch(fetchRoles({ activeOnly: true }) as any);
    dispatch(fetchPersonalities({ activeOnly: true }) as any);
  }, [dispatch]);

  const handleSendMessage = () => {
    if (inputMessage.trim() && isConnected) {
      // Enviar mensagem via WebSocket com agentId se selecionado
      sendMessage(inputMessage, 'text', selectedAgentId || undefined);
      
      // Adicionar mensagem localmente (será atualizada quando a resposta chegar)
      const newMessage: Message = {
        id: Date.now().toString(),
        content: inputMessage,
        timestamp: new Date().toISOString(),
        source: currentEngine || 'websocket',
        type: 'text',
      };
      
      dispatch(addMessage(newMessage));
      setInputMessage('');
    }
  };

  const handleAgentChange = (event: any) => {
    const agentId = event.target.value === '' ? null : event.target.value;
    dispatch(selectAgent(agentId));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'websocket':
        return 'primary';
      case 'whatsapp':
        return 'success';
      case 'system':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'websocket':
        return '🔌';
      case 'whatsapp':
        return '📱';
      case 'system':
        return '⚙️';
      default:
        return '💬';
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
      {/* Header */}
      <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" component="h2">
            Chat Interface
          </Typography>
          <Chip
            label={isConnected ? 'Conectado' : 'Desconectado'}
            color={isConnected ? 'success' : 'error'}
            variant="outlined"
          />
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

      {/* Messages */}
      <Paper
        elevation={1}
        sx={{
          flex: 1,
          overflow: 'auto',
          p: 1,
          mb: 2,
          maxHeight: 'calc(100vh - 300px)',
        }}
      >
        <List>
          {messages.map((message, index) => (
            <React.Fragment key={message.id}>
              <ListItem
                sx={{
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  px: 0,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, width: '100%' }}>
                  <Avatar sx={{ width: 24, height: 24, mr: 1, fontSize: '0.75rem' }}>
                    {getSourceIcon(message.source)}
                  </Avatar>
                  <Chip
                    label={message.source}
                    size="small"
                    color={getSourceColor(message.source)}
                    variant="outlined"
                  />
                  <Typography
                    variant="caption"
                    sx={{ ml: 'auto', color: 'text.secondary' }}
                  >
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </Typography>
                </Box>
                <Box sx={{ width: '100%', mt: 1 }}>
                  <MarkdownMessage content={message.content} />
                </Box>
              </ListItem>
              {index < messages.length - 1 && <Divider sx={{ my: 1 }} />}
            </React.Fragment>
          ))}
          <div ref={messagesEndRef} />
        </List>
      </Paper>

      {/* Input */}
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
    </Box>
  );
};

export default ChatInterface;
