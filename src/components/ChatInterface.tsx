import React, { useState, useRef, useEffect } from 'react';
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
  ListItemText,
  Avatar,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Send as SendIcon,
  AttachFile as AttachFileIcon,
  EmojiEmotions as EmojiIcon,
} from '@mui/icons-material';
import { RootState } from '../store';
import { addMessage } from '../store/chatSlice';
import { Message } from '../store/chatSlice';

const ChatInterface: React.FC = () => {
  const dispatch = useDispatch();
  const { messages, isConnected, currentEngine } = useSelector((state: RootState) => state.chat);
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (inputMessage.trim() && currentEngine) {
      const newMessage: Message = {
        id: Date.now().toString(),
        content: inputMessage,
        timestamp: new Date(),
        source: currentEngine,
        type: 'text',
      };
      
      dispatch(addMessage(newMessage));
      setInputMessage('');
    }
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
    <Box sx={{ height: 'calc(100vh - 200px)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" component="h2">
            Chat Interface
          </Typography>
          <Chip
            label={isConnected ? 'Conectado' : 'Desconectado'}
            color={isConnected ? 'success' : 'error'}
            variant="outlined"
          />
        </Box>
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
                    {message.timestamp.toLocaleTimeString()}
                  </Typography>
                </Box>
                <ListItemText
                  primary={message.content}
                  sx={{
                    '& .MuiListItemText-primary': {
                      wordBreak: 'break-word',
                      whiteSpace: 'pre-wrap',
                    },
                  }}
                />
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
