import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Chip,
  Divider,
  Tabs,
  Tab,
  Avatar,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Send as SendIcon,
  Phone as PhoneIcon,
  Chat as ChatIcon,
  Archive as ArchiveIcon,
} from '@mui/icons-material';
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

  const selectedConversation = conversations.find((c) => c.id === selectedConversationId);
  const currentMessages = selectedConversationId
    ? messagesByConversation[selectedConversationId] || []
    : [];

  useEffect(() => {
    dispatch(fetchConversations() as any);
  }, [dispatch]);

  useEffect(() => {
    if (selectedConversationId) {
      dispatch(selectConversation(selectedConversationId) as any);
      dispatch(fetchConversationMessages({ conversationId: selectedConversationId, limit: 50 }) as any);
    }
  }, [selectedConversationId, dispatch]);

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
                          <Box>
                            <Typography variant="caption" display="block">
                              {new Date(conversation.lastMessageAt).toLocaleString()}
                            </Typography>
                            <Chip
                              label={conversation.status}
                              size="small"
                              color={conversation.status === 'active' ? 'success' : 'default'}
                              sx={{ mt: 0.5 }}
                            />
                          </Box>
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
            </Box>

            <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
              <List>
                {currentMessages.length === 0 ? (
                  <ListItem>
                    <ListItemText
                      primary="Nenhuma mensagem ainda"
                      secondary="Envie uma mensagem para começar a conversa"
                    />
                  </ListItem>
                ) : (
                  currentMessages.map((message: any, index: number) => (
                    <React.Fragment key={message.id || index}>
                      <ListItem
                        sx={{
                          flexDirection: 'column',
                          alignItems: 'flex-start',
                          px: 0,
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, width: '100%' }}>
                          <Chip
                            label={getProviderLabel(message.source || selectedConversation.provider)}
                            size="small"
                            color={getProviderColor(message.source || selectedConversation.provider)}
                            variant="outlined"
                          />
                          <Typography variant="caption" sx={{ ml: 'auto', color: 'text.secondary' }}>
                            {new Date(message.timestamp).toLocaleTimeString()}
                          </Typography>
                        </Box>
                        <Box sx={{ width: '100%', mt: 1 }}>
                          <MarkdownMessage content={message.content} />
                        </Box>
                      </ListItem>
                      {index < currentMessages.length - 1 && <Divider sx={{ my: 1 }} />}
                    </React.Fragment>
                  ))
                )}
                <div ref={messagesEndRef} />
              </List>
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

