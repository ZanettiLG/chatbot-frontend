import React, { 
  useRef,
  useMemo,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import Chip from '@mui/material/Chip';
import Tabs from '@mui/material/Tabs';
import Paper from '@mui/material/Paper';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import ListItem from '@mui/material/ListItem';
import ChatIcon from '@mui/icons-material/Chat';
import PhoneIcon from '@mui/icons-material/Phone';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import ArchiveIcon from '@mui/icons-material/Archive';
import ListItemText from '@mui/material/ListItemText';
import ListItemButton from '@mui/material/ListItemButton';
import PsychologyIcon from '@mui/icons-material/Psychology';
import CircularProgress from '@mui/material/CircularProgress';

import { RootState } from '../../../store';
import { Message } from '../../../store/chatSlice';
import { MessageProtocol } from '../../../engines/types';
import { useWebSocket } from '../../../hooks/useWebSocket';
import { Conversation } from '../../../services/conversationService';
import { inferenceService, InferenceState } from '../../../services/inferenceService';
import {
  addMessage,
  fetchConversations,
  selectConversation,
  archiveConversation,
  setSelectedConversation,
  fetchConversationMessages,
} from '../../../store/conversationSlice';

import InferenceStateView from './components/InferenceStateView';
import MessageWithInference from './components/MessageWithInference';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = React.memo(function TabPanel(props: TabPanelProps) {
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
});

interface ConversationListItemProps {
  conversation: Conversation;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onArchive: (id: string) => void;
  getProviderIcon: (provider: string) => React.ReactNode;
  getProviderColor: (provider: string) => string;
}

const ConversationListItem = React.memo(({
  conversation,
  isSelected,
  onSelect,
  onArchive,
  getProviderIcon,
  getProviderColor,
}: ConversationListItemProps) => {
  const handleSelect = useCallback(() => {
    onSelect(conversation.id);
  }, [onSelect, conversation.id]);

  const handleArchive = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onArchive(conversation.id);
  }, [onArchive, conversation.id]);

  const lastMessageDate = useMemo(
    () => new Date(conversation.lastMessageAt).toLocaleString(),
    [conversation.lastMessageAt]
  );

  return (
    <>
      <ListItem disablePadding>
        <ListItemButton selected={isSelected} onClick={handleSelect}>
          <Avatar sx={{ mr: 2, bgcolor: getProviderColor(conversation.provider) + '.main' }}>
            {getProviderIcon(conversation.provider)}
          </Avatar>
          <ListItemText
            primary={conversation.contactName || conversation.contactIdentifier}
            secondary={
              <Box component="div">
                <Typography variant="caption" component="span" display="block">
                  {lastMessageDate}
                </Typography>
                <Chip
                  label={conversation.status}
                  size="small"
                  color={conversation.status === 'active' ? 'success' : 'default'}
                  sx={{ mt: 0.5, display: 'inline-block' }}
                />
              </Box>
            }
            secondaryTypographyProps={{ component: 'div' }}
          />
          <IconButton edge="end" onClick={handleArchive} size="small">
            <ArchiveIcon />
          </IconButton>
        </ListItemButton>
      </ListItem>
      <Divider />
    </>
  );
});

ConversationListItem.displayName = 'ConversationListItem';




const History: React.FC = () => {
  const dispatch = useDispatch();
  const { conversations, selectedConversationId, messagesByConversation, loading, error } = useSelector(
    (state: RootState) => state.conversation
  );
  const [tabValue, setTabValue] = useState(0);
  const previousMessageCountRef = useRef<number>(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastMessageIdRef = useRef<string | null>(null);
  const previousMessagesIdsStringRef = useRef<string>('');
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [showInference, setShowInference] = useState(false);
  const [latestInference, setLatestInference] = useState<InferenceState | null>(null);

  // Memoizar conversa selecionada
  const selectedConversation = useMemo(
    () => conversations.find((c) => c.id === selectedConversationId),
    [conversations, selectedConversationId]
  );

  // Memoizar mensagens atuais - usar string de IDs para comparação estável
  const currentMessages = useMemo(() => selectedConversationId && messagesByConversation[selectedConversationId] || [], [selectedConversationId, messagesByConversation]);
  
  // Criar uma string de IDs das mensagens para comparação estável
  const messagesIdsString = useMemo(() => {
    if (!currentMessages || currentMessages.length === 0) return '';
    return currentMessages.map(m => m?.id || '').filter(id => id).join(',');
  }, [currentMessages]);

  // Carregar conversas inicialmente
  useEffect(() => {
    dispatch(fetchConversations());
  }, [dispatch]);

  // Atualização automática da lista de conversas (polling a cada 5 segundos)
  useEffect(() => {
    const interval = setInterval(() => {
      dispatch(fetchConversations());
    }, 5000); // Atualizar a cada 5 segundos

    return () => clearInterval(interval);
  }, [dispatch]);

  // Carregar mensagens quando uma conversa é selecionada
  useEffect(() => {
    if (selectedConversationId) {
      // Resetar contadores quando mudar de conversa
      lastMessageIdRef.current = null;
      previousMessageCountRef.current = 0;
      previousMessagesIdsStringRef.current = '';
      
      // Atualização automática das mensagens (polling a cada 3 segundos)
      const messageInterval = setInterval(() => {
        dispatch(fetchConversationMessages({ conversationId: selectedConversationId, limit: 50 }));
      }, 3000); // Atualizar a cada 3 segundos
      
      // Buscar inferência mais recente usando selectedConversation do useMemo
      if (selectedConversation) {
        loadLatestInference(selectedConversation.sessionId);
      }
      
      return () => {
        clearInterval(messageInterval);
      };
    } else {
      console.log('Nenhuma conversa selecionada');
    }
  }, [selectedConversationId, dispatch, selectedConversation]);

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

  // Scroll automático apenas quando há novas mensagens
  // Usar messagesIdsString para evitar disparos por mudança de referência do array
  useEffect(() => {
    // Verificar se há mensagens válidas
    if (!currentMessages || currentMessages.length === 0) {
      // Se não há mensagens, resetar contadores mas não fazer scroll
      if (previousMessageCountRef.current !== 0) {
        previousMessageCountRef.current = 0;
        lastMessageIdRef.current = null;
        previousMessagesIdsStringRef.current = '';
      }
      return;
    }
    
    // Comparar strings de IDs em vez de referências de array
    const hasChanged = messagesIdsString !== previousMessagesIdsStringRef.current;
    
    if (!hasChanged) {
      // Se os IDs não mudaram, não há novas mensagens - não fazer nada
      return;
    }
    
    // IDs mudaram - verificar se é realmente uma nova mensagem
    const currentMessageCount = currentMessages.length;
    const previousMessageCount = previousMessageCountRef.current;
    const hasNewMessages = currentMessageCount > previousMessageCount;
    
    // Verificar se a última mensagem mudou (nova mensagem adicionada)
    const lastMessage = currentMessages[currentMessages.length - 1];
    const lastMessageId = lastMessage?.id || null;
    const isNewMessage = lastMessageId !== lastMessageIdRef.current;
    
    // Atualizar referências SEMPRE que os IDs mudarem
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
  }, [messagesIdsString, currentMessages]);

  // Função auxiliar para adicionar mensagem à conversa (memoizada)
  const addMessageToConversation = useCallback((conversationId: string, protocol: MessageProtocol) => {
    const messageContent =
      typeof protocol.data === 'string'
        ? protocol.data
        : protocol.data?.content || protocol.data?.body || '';
    
    dispatch(
      addMessage({
        conversationId,
        message: {
          id: protocol.id,
          source: protocol.source,
          content: messageContent,
          timestamp: new Date().toISOString(),
        },
      })
    );
    
    // Sempre atualizar a lista de conversas quando uma nova mensagem chegar
    // Isso garante que a contagem de mensagens e última mensagem sejam atualizadas
    dispatch(fetchConversations());
  }, [dispatch]);

  // WebSocket para receber mensagens em tempo real (apenas leitura)
  const handleWebSocketMessage = useCallback((protocol: MessageProtocol) => {
    if (protocol.route === 'chat' && protocol.action === 'message:received') {
      const sessionId = protocol.sessionId;
      
      // Sempre atualizar a lista de conversas primeiro para garantir que temos a versão mais recente
      dispatch(fetchConversations()).then((result) => {
        const updatedConversations = result.payload || [];
        const conversation = updatedConversations.find((c: Conversation) => c.sessionId === sessionId);
        
        if (conversation) {
          // Se encontrou a conversa, adicionar a mensagem
          addMessageToConversation(conversation.id, protocol);
        }
      });
    }
  }, [dispatch, addMessageToConversation]);

  useWebSocket({
    onMessage: handleWebSocketMessage,
  });

  // Memoizar funções de callback
  const handleTabChange = useCallback((_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    dispatch(setSelectedConversation(null));
  }, [dispatch]);

  const handleConversationSelect = useCallback((conversationId: string) => {
    dispatch(setSelectedConversation(conversationId));
  }, [dispatch]);

  const handleArchive = useCallback(async (conversationId: string) => {
    if (window.confirm('Tem certeza que deseja arquivar esta conversa?')) {
      await dispatch(archiveConversation(conversationId));
      if (selectedConversationId === conversationId) {
        dispatch(setSelectedConversation(null));
      }
    }
  }, [dispatch, selectedConversationId]);

  // Memoizar conversas filtradas
  const filteredConversations = useMemo(
    () => {
      if (tabValue === 0) return conversations.filter((conv) => conv.provider === 'websocket');
      if (tabValue === 1) return conversations.filter((conv) => conv.provider === 'whatsapp');
      return conversations;
    },
    [conversations, tabValue]
  );

  // Memoizar funções auxiliares
  const getProviderIcon = useCallback((provider: string) => {
    if (provider === 'whatsapp') return <PhoneIcon />;
    return <ChatIcon />;
  }, []);

  const getProviderColor = useCallback((provider: string) => {
    if (provider === 'whatsapp') return 'success';
    if (provider === 'manager') return 'warning';
    if (provider === 'system') return 'info';
    return 'primary';
  }, []);

  return (
    <Box sx={{ height: 'calc(100vh - 200px)', display: 'flex', gap: 2 }}>
      {/* Lista de Conversas */}
      <Paper elevation={2} sx={{ width: 350, display: 'flex', flexDirection: 'column', position: 'relative' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="conversation tabs">
            <Tab label="WebSocket" icon={<ChatIcon />} iconPosition="start" />
            <Tab label="WhatsApp" icon={<PhoneIcon />} iconPosition="start" />
          </Tabs>
        </Box>

        {error ? (
          <Alert severity="error" sx={{ m: 2 }}>
            {error}
          </Alert>
        ) : (
          <>
            {loading && (
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                p: 0.5, 
                position: 'absolute', 
                top: 48, 
                left: 0, 
                right: 0, 
                zIndex: 10,
                bgcolor: 'background.paper',
                borderBottom: '1px solid',
                borderColor: 'divider'
              }}>
                <CircularProgress size={16} />
              </Box>
            )}
            <List sx={{ 
              flex: 1, 
              overflow: 'auto', 
              opacity: loading ? 0.6 : 1, 
              transition: 'opacity 0.15s ease-in-out',
              pt: loading ? 3 : 0
            }}>
              {filteredConversations.length === 0 && !loading ? (
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
                  <ConversationListItem
                    key={conversation.id}
                    conversation={conversation}
                    isSelected={selectedConversationId === conversation.id}
                    onSelect={handleConversationSelect}
                    onArchive={handleArchive}
                    getProviderIcon={getProviderIcon}
                    getProviderColor={getProviderColor}
                  />
                ))
              )}
            </List>
          </>
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

            <Box 
              ref={messagesContainerRef}
              sx={{ flex: 1, overflow: 'auto', p: 2 }}
            >
              {!currentMessages || currentMessages.length === 0 ? (
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
                    Esta conversa não possui mensagens
                  </Typography>
                </Box>
              ) : (
                <Box>
                  {currentMessages.map((message: Message) => (
                      <MessageWithInference
                        key={message.id}
                        message={message}
                        isUser={message.source === 'websocket'}
                      />
                    ))}
                  <div ref={messagesEndRef} />
                </Box>
              )}
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

export default History;

