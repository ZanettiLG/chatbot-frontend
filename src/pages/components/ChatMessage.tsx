import React, { useMemo } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import PersonIcon from '@mui/icons-material/Person';
import SmartToyIcon from '@mui/icons-material/SmartToy';

import { Message } from '../../store/chatSlice';
import MarkdownMessage from '../../components/MarkdownMessage';


interface ChatAuthorProps {
  name: string;
  avatar?: string;
  type: 'user' | 'agent';
}

interface ChatAvatarProps {
  align: 'left' | 'right';
}

interface ChatMessageProps extends ChatAvatarProps {
  message: Message;
  author: ChatAuthorProps;
}

interface ChatAvatarProps extends Partial<ChatAuthorProps> {}

const ChatAvatar = React.memo<ChatAvatarProps>(({ avatar, type}: ChatAvatarProps) => {
  const isAgent = useMemo(() => type === 'agent', [type]);
  return (
    <Avatar
      src={avatar}
      sx={{
        width: 32,
        height: 32,
        bgcolor: isAgent ? 'secondary.main' : 'primary.main',
      }}
    >
      {isAgent ? <SmartToyIcon /> : <PersonIcon />}
    </Avatar>
  );
});

ChatAvatar.displayName = 'ChatAvatar';

interface ChatHeaderProps {
  message: Message;
  author: ChatAuthorProps;
  isLeft: boolean;
}

const ChatHeader = React.memo<ChatHeaderProps>(({ message, author, isLeft }: ChatHeaderProps) => {
  const formattedTime = useMemo(
    () => new Date(message.timestamp).toLocaleTimeString(),
    [message.timestamp]
  );

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1, 
        mb: 0.5,
        flexDirection: isLeft ? 'row' : 'row-reverse',
      }}
    >
      <ChatAvatar
        type={author.type}
        avatar={author.avatar}
      />
      <Typography 
        variant="caption" 
        sx={{ 
          fontWeight: 600,
          color: 'text.secondary',
        }}
      >
        {author.name}
      </Typography>
      <Typography 
        variant="caption" 
        sx={{ 
          color: 'text.secondary',
          opacity: 0.6,
        }}
      >
        {formattedTime}
      </Typography>
    </Box>
  );
});

ChatHeader.displayName = 'ChatHeader';

const ChatMessage = React.memo<ChatMessageProps>(({ message, author, align, children }: ChatMessageProps) => {
  const isLeft = useMemo(() => align === 'left', [align]);
  return (
    <Box 
      sx={{ 
        mb: 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: isLeft ? 'flex-start' : 'flex-end',
      }}
    >
      <ChatHeader message={message} author={author} isLeft={isLeft} />
      <Paper
        elevation={1}
        sx={{
          px: 2,
          borderRadius: 2,
          border: '1px solid',
          borderColor: !isLeft ? 'none' : 'divider',
          bgcolor: !isLeft ? 'primary.main' : 'background.paper',
          color: !isLeft ? 'primary.contrastText' : 'text.primary',
        }}
      >
        <MarkdownMessage>{message.content}</MarkdownMessage>
        {children}
      </Paper>
    </Box>
  );
});

ChatMessage.displayName = 'ChatMessage';

export default ChatMessage;

