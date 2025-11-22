import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PsychologyIcon from '@mui/icons-material/Psychology';
import CircularProgress from '@mui/material/CircularProgress';

import { RootState } from '../../../../store';
import { Message } from '../../../../store/chatSlice';
import ChatMessage from '../../../components/ChatMessage';
import { inferenceService, InferenceState } from '../../../../services/inferenceService';
import InferenceMessageView from './InferenceMessageView';
interface MessageWithInferenceProps {
  message: Message;
  isUser: boolean;
}

const MessageWithInference = React.memo<MessageWithInferenceProps>(({ message, isUser }: MessageWithInferenceProps) => {
  const [inference, setInference] = useState<InferenceState | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  
  // Otimizar seletor do Redux - apenas buscar o que precisamos
  const selectedAgentId = useSelector((state: RootState) => state.agent.selectedAgentId);
  const agentName = useSelector((state: RootState) => {
    if (!selectedAgentId) return 'Agente';
    const agent = state.agent.agents.find(a => a.id === selectedAgentId);
    return agent?.name || 'Agente';
  });

  useEffect(() => {
    // Buscar inference para mensagens do usuário
    // O pensamento (inference) é associado à mensagem do usuário, não à resposta do agente
    // Quando o usuário envia uma mensagem, o agente processa e gera um inference associado a essa mensagem
    if (isUser && message.id) {
      setLoading(true);
      
      inferenceService
        .getByMessageId(message.id)
        .then((data) => {
          setInference(data);
          setLoading(false);
        })
        .catch((err) => {
          // Silenciar erro 404 (não há inference para esta mensagem)
          if (err.message && !err.message.includes('404')) {
            console.warn('Error fetching inference:', err);
          }
          setInference(null);
          setLoading(false);
        });
    } else {
      // Para mensagens do agente, não buscar inference (o pensamento está associado à mensagem do usuário)
      setInference(null);
      setLoading(false);
    }
  }, [message.id, isUser]);

  // Memoizar funções auxiliares
  const getStateColor = useCallback((state: string) => {
    switch (state) {
      case 'OBSERVATION':
        return 'default';
      case 'ANALYSIS':
        return 'info';
      case 'CONTRADICTION':
        return 'warning';
      case 'SYNTHESIS':
        return 'primary';
      case 'ACTION':
        return 'success';
      default:
        return 'default';
    }
  }, []);

  const getStateLabel = useCallback((state: string) => {
    switch (state) {
      case 'OBSERVATION':
        return 'Observação';
      case 'ANALYSIS':
        return 'Análise';
      case 'CONTRADICTION':
        return 'Contradição';
      case 'SYNTHESIS':
        return 'Síntese';
      case 'ACTION':
        return 'Ação';
      default:
        return state;
    }
  }, []);

  const hasInference = useMemo(() => inference !== null && !loading, [inference, loading]);
  
  const handleToggleExpanded = useCallback(() => {
    setExpanded(prev => !prev);
  }, []);

  return (
    <Box 
      sx={{ 
        mb: 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: isUser ? 'flex-end' : 'flex-start',
      }}
    >
      <ChatMessage
        message={message}
        author={{ name: isUser ? 'Você' : agentName, type: isUser ? 'user' : 'agent' }}
        align={isUser ? 'right' : 'left'}
      >
        {/* Badge e botão para expandir pensamento (apenas para mensagens do usuário) */}
        {isUser && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1.5 }}>
            {loading ? (
              <CircularProgress size={16} />
            ) : hasInference ? (
              <>
                <Chip
                  icon={<PsychologyIcon />}
                  label="Ver pensamento"
                  size="small"
                  color={getStateColor(inference.state)}
                  variant="outlined"
                  sx={{ cursor: 'pointer' }}
                  onClick={handleToggleExpanded}
                />
                <IconButton
                  size="small"
                  onClick={handleToggleExpanded}
                  sx={{ ml: 'auto', color: 'text.secondary' }}
                >
                  {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              </>
            ) : null}
          </Box>
        )}
      </ChatMessage>
      {/* <Paper
        elevation={1}
        sx={{
          p: 2,
          bgcolor: isUser ? 'primary.main' : 'background.paper',
          color: isUser ? 'primary.contrastText' : 'text.primary',
          borderRadius: 2,
          maxWidth: '75%',
          border: isUser ? 'none' : '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {message.content}
        </Typography>

            
      </Paper> */}

      {/* Pensamento expandido (apenas para mensagens do usuário) */}
      <InferenceMessageView
        isUser={isUser}
        expanded={expanded}
        inference={inference}
        hasInference={hasInference}
        getStateColor={getStateColor}
        getStateLabel={getStateLabel}
      />
    </Box>
  );
}, (prevProps, nextProps) => {
  // Comparação customizada para evitar re-renders desnecessários
  return (
    prevProps.message.id === nextProps.message.id &&
    prevProps.message.content === nextProps.message.content &&
    prevProps.message.timestamp === nextProps.message.timestamp &&
    prevProps.isUser === nextProps.isUser
  );
});

MessageWithInference.displayName = 'MessageWithInference';

export default MessageWithInference;

