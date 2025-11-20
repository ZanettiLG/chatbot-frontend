import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import SendIcon from '@mui/icons-material/Send';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import EmojiIcon from '@mui/icons-material/EmojiEmotions';
import { RootState } from '../store';
import { addMessage } from '../store/chatSlice';
import { Message } from '../store/chatSlice';
import { useWebSocket } from '../hooks/useWebSocket';
import { MessageProtocol } from '../engines/types';
import { selectAgent, fetchAgents } from '../store/agentSlice';
import { fetchRoles } from '../store/roleSlice';
import { fetchPersonalities } from '../store/personalitySlice';
import { useParams } from 'react-router-dom';
import Drawer from '@mui/material/Drawer';
import Badge from '@mui/material/Badge';
import TrackChangesIcon from '@mui/icons-material/TrackChanges';
import CloseIcon from '@mui/icons-material/Close';
import { fetchConversationState } from '../store/conversationStateSlice';
import ConversationStatePanel from './ConversationStatePanel';
import MessageWithInference from './MessageWithInference';

const ChatInterface: React.FC = () => {
  const dispatch = useDispatch();
  const { agentId } = useParams();
  const { messages, isConnected, currentEngine } = useSelector((state: RootState) => state.chat);
  const { agents, selectedAgentId } = useSelector((state: RootState) => state.agent);
  const { roles } = useSelector((state: RootState) => state.role);
  const { personalities } = useSelector((state: RootState) => state.personality);
  const { currentState: conversationState, loading: conversationStateLoading } = useSelector(
    (state: RootState) => state.conversationState
  );
  const [inputMessage, setInputMessage] = useState('');
  const [goapPanelOpen, setGoapPanelOpen] = useState(false);
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

  useEffect(() => {
    if (agentId) {
      dispatch(selectAgent(agentId) as any);
    }
  }, [agentId, dispatch]);

  // Carregar agentes, roles e personalidades ao montar componente
  useEffect(() => {
    dispatch(fetchAgents(true) as any); // Carregar apenas agentes ativos
    dispatch(fetchRoles({ activeOnly: true }) as any);
    dispatch(fetchPersonalities({ activeOnly: true }) as any);
  }, [dispatch]);

  // Polling para atualizar ConversationState
  useEffect(() => {
    if (!goapPanelOpen || !selectedAgentId) return;

    // Usar selectedAgentId como sessionId temporário
    // Em produção, isso deveria vir do backend ou ser persistido
    const sessionId = selectedAgentId || `session_${Date.now()}`;
    
    const fetchState = () => {
      dispatch(fetchConversationState(sessionId) as any);
    };

    // Buscar imediatamente
    fetchState();

    // Polling a cada 5 segundos
    const interval = setInterval(fetchState, 5000);

    return () => clearInterval(interval);
  }, [goapPanelOpen, selectedAgentId, dispatch]);

  // Atualizar quando nova mensagem chegar
  useEffect(() => {
    if (goapPanelOpen && selectedAgentId && messages.length > 0) {
      const sessionId = selectedAgentId || `session_${Date.now()}`;
      dispatch(fetchConversationState(sessionId) as any);
    }
  }, [messages.length, goapPanelOpen, selectedAgentId, dispatch]);

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
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {selectedAgentId && (
              <Tooltip title="Estado GOAP">
                <IconButton
                  onClick={() => setGoapPanelOpen(!goapPanelOpen)}
                  color={goapPanelOpen ? 'primary' : 'default'}
                >
                  <Badge
                    badgeContent={conversationState?.currentGoals.length || 0}
                    color="primary"
                    max={99}
                  >
                    <TrackChangesIcon />
                  </Badge>
                </IconButton>
              </Tooltip>
            )}
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

      {/* Messages */}
      <Paper
        elevation={1}
        sx={{
          flex: 1,
          overflow: 'auto',
          p: 2,
          mb: 2,
          maxHeight: 'calc(100vh - 300px)',
        }}
      >
        <Box>
          {messages.map((message, index) => {
            // Determinar se é mensagem do usuário baseado no source:
            // - 'websocket' = mensagem do usuário (cliente)
            // - 'system' = mensagem do agente (resposta da IA)
            // - 'manager' = mensagem do gerente/administrador (painel)
            // - 'whatsapp' = mensagem do WhatsApp (pode ser usuário ou agente, depende do contexto)
            let isUser = false;
            
            if (message.source === 'system') {
              // Mensagem do agente - NÃO é do usuário
              isUser = false;
            } else if (message.source === 'manager') {
              // Mensagem do gerente/administrador - tratar como usuário para exibição
              isUser = true;
            } else if (message.source === 'websocket') {
              // Mensagem do usuário via WebSocket
              // Se tem userId e não é 'manager', pode ser do usuário ou do agente
              // Por padrão, websocket sem userId específico é do usuário
              isUser = !message.userId || message.userId === 'user' || message.userId === 'current_user_id';
            } else if (message.source === 'whatsapp') {
              // Para WhatsApp, precisamos verificar melhor, mas por padrão assumir que não é do usuário
              // (mensagens do WhatsApp geralmente são do cliente, mas a resposta vem como 'system')
              isUser = false; // Por padrão, mensagens do WhatsApp são do cliente, mas a resposta vem como 'system'
            } else {
              // Se não tem source definido, tentar inferir pela posição (alternância)
              isUser = index % 2 === 0;
            }
            
            return (
              <MessageWithInference
                key={message.id}
                message={message}
                isUser={isUser}
              />
            );
          })}
          <div ref={messagesEndRef} />
        </Box>
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

      {/* Drawer para painel GOAP */}
      <Drawer
        anchor="right"
        open={goapPanelOpen}
        onClose={() => setGoapPanelOpen(false)}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: 400, md: 500 },
            p: 2,
          },
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Estado GOAP</Typography>
          <IconButton onClick={() => setGoapPanelOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
        <ConversationStatePanel
          conversationState={conversationState}
          loading={conversationStateLoading}
        />
      </Drawer>
    </Box>
  );
};

export default ChatInterface;
