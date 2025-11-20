import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemButton from '@mui/material/ListItemButton';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import SendIcon from '@mui/icons-material/Send';
import PhoneIcon from '@mui/icons-material/Phone';
import ChatIcon from '@mui/icons-material/Chat';
import ArchiveIcon from '@mui/icons-material/Archive';
import PsychologyIcon from '@mui/icons-material/Psychology';
import { RootState } from '../store';
import {
  fetchConversations,
  selectConversation,
  sendMessageToConversation,
  archiveConversation,
  setSelectedConversation,
  addMessage,
  fetchConversationMessages,
} from '../store/conversationSlice';
import { Conversation } from '../services/conversationService';
import { useWebSocket } from '../hooks/useWebSocket';
import { MessageProtocol } from '../engines/types';
import MarkdownMessage from './MarkdownMessage';
import InferenceStateView from './InferenceStateView';
import MessageWithInference from './MessageWithInference';
import { inferenceService, InferenceState } from '../services/inferenceService';
import { Message } from '../store/chatSlice';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`conversation-tabpanel-${index}`}
      aria-labelledby={`conversation-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
}

const UnifiedChatInterface: React.FC = () => {
  const dispatch = useDispatch();
  const { conversations, selectedConversationId, messagesByConversation, loading, error } = useSelector(
    (state: RootState) => state.conversation
  );
  const [tabValue, setTabValue] = useState(0);
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [latestInference, setLatestInference] = useState<InferenceState | null>(null);
  const [showInference, setShowInference] = useState(false);

  const selectedConversation = conversations.find((c) => c.id === selectedConversationId);
  const currentMessages = selectedConversationId
    ? messagesByConversation[selectedConversationId] || []
    : [];

  // Debug: Log das mensagens atuais
  useEffect(() => {
    if (selectedConversationId) {
      console.log('📊 Estado atual das mensagens:', {
        selectedConversationId,
        messageCount: currentMessages.length,
        messages: currentMessages,
        messagesByConversationKeys: Object.keys(messagesByConversation),
        allMessagesByConversation: messagesByConversation,
      });
    } else {
      console.log('ℹ️ Nenhuma conversa selecionada');
    }
  }, [selectedConversationId, currentMessages.length, messagesByConversation]);

  useEffect(() => {
    dispatch(fetchConversations() as any);
  }, [dispatch]);

  useEffect(() => {
    if (selectedConversationId) {
      console.log('🔄 Selecionando conversa:', selectedConversationId);
      dispatch(selectConversation(selectedConversationId) as any);
      
      // Buscar mensagens da conversa
      console.log('📥 Buscando mensagens para conversa:', selectedConversationId);
      dispatch(fetchConversationMessages({ conversationId: selectedConversationId, limit: 50 }) as any)
        .then((result: any) => {
          console.log('✅ Mensagens carregadas com sucesso:', {
            conversationId: selectedConversationId,
            messageCount: result.payload?.messages?.length || 0,
            messages: result.payload?.messages,
            payload: result.payload,
          });
        })
        .catch((error: any) => {
          console.error('❌ Erro ao carregar mensagens:', error);
        });
      
      // Buscar inferência mais recente
      const selectedConv = conversations.find((c) => c.id === selectedConversationId);
      if (selectedConv) {
        loadLatestInference(selectedConv.sessionId);
      }
    }
  }, [selectedConversationId, dispatch, conversations]);

  // Atualizar inferência quando novas mensagens chegarem
  useEffect(() => {
    if (selectedConversationId && currentMessages.length > 0) {
      const lastMessage = currentMessages[currentMessages.length - 1];
      if (lastMessage.source === 'system') {
        // Se a última mensagem é do sistema (resposta da IA), buscar inferência
        loadLatestInference(selectedConversationId);
      }
    }
  }, [currentMessages, selectedConversationId]);

  const loadLatestInference = async (sessionId: string) => {
    try {
      const inference = await inferenceService.getLatest(sessionId);
      setLatestInference(inference);
    } catch (error) {
      console.error('Error loading inference:', error);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages]);

  // WebSocket para receber mensagens em tempo real
  const { sendMessage: sendWebSocketMessage } = useWebSocket({
    onMessage: (protocol: MessageProtocol) => {
      console.log('📥 UnifiedChatInterface: Message received:', {
        route: protocol.route,
        action: protocol.action,
        source: protocol.source,
        sessionId: protocol.sessionId,
        hasData: !!protocol.data,
      });
      
      if (protocol.route === 'chat' && protocol.action === 'message:received') {
        const sessionId = protocol.sessionId;
        const conversation = conversations.find((c) => c.sessionId === sessionId);
        
        console.log('📥 UnifiedChatInterface: Processing message:', {
          sessionId,
          foundConversation: !!conversation,
          conversationId: conversation?.id,
          source: protocol.source,
        });
        
        if (conversation) {
          const messageContent =
            typeof protocol.data === 'string'
              ? protocol.data
              : protocol.data?.content || protocol.data?.body || '';
          
          console.log('📥 UnifiedChatInterface: Adding message to conversation:', {
            conversationId: conversation.id,
            messageId: protocol.id,
            content: messageContent.substring(0, 50),
            source: protocol.source,
          });
          
          dispatch(
            addMessage({
              conversationId: conversation.id,
              message: {
                id: protocol.id,
                content: messageContent,
                timestamp: new Date().toISOString(),
                source: protocol.source,
              },
            })
          );
        } else {
          console.warn('⚠️ UnifiedChatInterface: Conversation not found for sessionId:', sessionId);
        }
      }
    },
  });

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    dispatch(setSelectedConversation(null));
  };

  const handleConversationSelect = (conversationId: string) => {
    dispatch(setSelectedConversation(conversationId));
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !selectedConversationId) return;

    try {
      // Não adicionar mensagem localmente - esperar a resposta do backend
      // O backend enviará a mensagem com source: 'manager' e ela será recebida via WebSocket
      await dispatch(
        sendMessageToConversation({
          conversationId: selectedConversationId,
          message: inputMessage,
        }) as any
      );

      setInputMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleArchive = async (conversationId: string) => {
    if (window.confirm('Tem certeza que deseja arquivar esta conversa?')) {
      await dispatch(archiveConversation(conversationId) as any);
      if (selectedConversationId === conversationId) {
        dispatch(setSelectedConversation(null));
      }
    }
  };

  const filteredConversations = conversations.filter((conv) => {
    if (tabValue === 0) return conv.provider === 'websocket';
    if (tabValue === 1) return conv.provider === 'whatsapp';
    return true;
  });

  const getProviderIcon = (provider: string) => {
    if (provider === 'whatsapp') return <PhoneIcon />;
    if (provider === 'manager') return <ChatIcon />;
    if (provider === 'system') return <ChatIcon />;
    return <ChatIcon />;
  };

  const getProviderColor = (provider: string) => {
    if (provider === 'whatsapp') return 'success';
    if (provider === 'manager') return 'warning';
    if (provider === 'system') return 'info';
    return 'primary';
  };

  const getProviderLabel = (source: string) => {
    if (source === 'manager') return 'Gerente';
    if (source === 'system') return 'Sistema';
    return source;
  };

  return (
    <Box sx={{ height: 'calc(100vh - 200px)', display: 'flex', gap: 2 }}>
      {/* Lista de Conversas */}
      <Paper elevation={2} sx={{ width: 350, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="conversation tabs">
            <Tab label="WebSocket" icon={<ChatIcon />} iconPosition="start" />
            <Tab label="WhatsApp" icon={<PhoneIcon />} iconPosition="start" />
          </Tabs>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ m: 2 }}>
            {error}
          </Alert>
        ) : (
          <List sx={{ flex: 1, overflow: 'auto' }}>
            {filteredConversations.length === 0 ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300, p: 4 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Nenhuma conversa encontrada
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    As conversas aparecerão aqui quando houver mensagens
                  </Typography>
                </Box>
              </Box>
            ) : (
              filteredConversations.map((conversation) => (
                <React.Fragment key={conversation.id}>
                  <ListItem disablePadding>
                    <ListItemButton
                      selected={selectedConversationId === conversation.id}
                      onClick={() => handleConversationSelect(conversation.id)}
                    >
                      <Avatar sx={{ mr: 2, bgcolor: getProviderColor(conversation.provider) + '.main' }}>
                        {getProviderIcon(conversation.provider)}
                      </Avatar>
                      <ListItemText
                        primary={conversation.contactName || conversation.contactIdentifier}
                        secondary={
                          <>
                            <Typography variant="caption" component="span" display="block">
                              {new Date(conversation.lastMessageAt).toLocaleString()}
                            </Typography>
                            <Chip
                              label={conversation.status}
                              size="small"
                              color={conversation.status === 'active' ? 'success' : 'default'}
                              sx={{ mt: 0.5, display: 'inline-block' }}
                            />
                          </>
                        }
                      />
                      <IconButton
                        edge="end"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleArchive(conversation.id);
                        }}
                        size="small"
                      >
                        <ArchiveIcon />
                      </IconButton>
                    </ListItemButton>
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))
            )}
          </List>
        )}
      </Paper>

      {/* Painel de Mensagens */}
      <Paper elevation={2} sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {selectedConversation ? (
          <>
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar sx={{ bgcolor: getProviderColor(selectedConversation.provider) + '.main' }}>
                    {getProviderIcon(selectedConversation.provider)}
                  </Avatar>
                  <Box>
                    <Typography variant="h6">
                      {selectedConversation.contactName || selectedConversation.contactIdentifier}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {selectedConversation.provider} • {selectedConversation.messageCount} mensagens
                    </Typography>
                  </Box>
                </Box>
                {latestInference && (
                  <Tooltip title={showInference ? 'Ocultar estado de pensamento' : 'Mostrar estado de pensamento'}>
                    <IconButton
                      onClick={() => setShowInference(!showInference)}
                      color={showInference ? 'primary' : 'default'}
                    >
                      <PsychologyIcon />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            </Box>

            {/* Visualização do Estado de Inferência */}
            {showInference && latestInference && (
              <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', bgcolor: 'background.default' }}>
                <InferenceStateView inferenceState={latestInference} compact />
              </Box>
            )}

            <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
              {currentMessages.length === 0 ? (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: 200,
                    color: 'text.secondary',
                  }}
                >
                  <ChatIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                  <Typography variant="h6" gutterBottom>
                    Nenhuma mensagem ainda
                  </Typography>
                  <Typography variant="body2">
                    Envie uma mensagem para começar a conversa
                  </Typography>
                </Box>
              ) : (
                <Box>
                  {currentMessages.map((message: any, index: number) => {
                    // Determinar se é mensagem do usuário baseado no source:
                    // - 'websocket' = mensagem do usuário (cliente) - SEM userId ou com userId do usuário
                    // - 'system' = mensagem do agente (resposta da IA)
                    // - 'manager' = mensagem do gerente/administrador (painel)
                    // 
                    // IMPORTANTE: Se a mensagem não tem source definido, tentar inferir pela posição:
                    // - Mensagens em posições pares (0, 2, 4...) geralmente são do usuário
                    // - Mensagens em posições ímpares (1, 3, 5...) geralmente são do agente
                    let isUser = false;
                    let isManager = false;
                    
                    if (message.source === 'system') {
                      // Mensagem do agente
                      isUser = false;
                    } else if (message.source === 'manager') {
                      // Mensagem do gerente/administrador
                      isManager = true;
                      isUser = true; // Tratar como mensagem do usuário para exibição
                    } else if (message.source === 'websocket') {
                      // Mensagem do usuário via WebSocket
                      isUser = true;
                    } else {
                      // Se não tem source definido, tentar inferir pela posição
                      // Alternância: usuário, agente, usuário, agente...
                      isUser = index % 2 === 0;
                      console.warn('⚠️ [UnifiedChatInterface] Mensagem sem source definido, inferindo pela posição:', {
                        index,
                        isUser,
                        messageId: message.id,
                      });
                    }
                    
                    // Converter para formato Message do chatSlice
                    const chatMessage: Message = {
                      id: message.id,
                      content: message.content || '',
                      timestamp: message.timestamp,
                      source: message.source || (isUser ? 'websocket' : 'system'),
                      userId: isUser ? 'user' : (isManager ? 'manager' : undefined),
                      type: 'text',
                    };
                    
                    return (
                      <MessageWithInference
                        key={message.id}
                        message={chatMessage}
                        isUser={isUser || isManager}
                      />
                    );
                  })}
                  <div ref={messagesEndRef} />
                </Box>
              )}
            </Box>

            <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  multiline
                  maxRows={4}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Digite sua mensagem..."
                  variant="outlined"
                  size="small"
                />
                <Button
                  variant="contained"
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim()}
                  startIcon={<SendIcon />}
                >
                  Enviar
                </Button>
              </Box>
            </Box>
          </>
        ) : (
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            <ChatIcon sx={{ fontSize: 64, color: 'text.secondary' }} />
            <Typography variant="h6" color="text.secondary">
              Selecione uma conversa para começar
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default UnifiedChatInterface;

