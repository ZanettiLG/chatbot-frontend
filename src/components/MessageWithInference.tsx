import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Collapse from '@mui/material/Collapse';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import LinearProgress from '@mui/material/LinearProgress';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import Avatar from '@mui/material/Avatar';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PsychologyIcon from '@mui/icons-material/Psychology';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import PersonIcon from '@mui/icons-material/Person';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import { Message } from '../store/chatSlice';
import { inferenceService, InferenceState } from '../services/inferenceService';
import CircularProgress from '@mui/material/CircularProgress';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

interface MessageWithInferenceProps {
  message: Message;
  isUser: boolean;
}

const MessageWithInference: React.FC<MessageWithInferenceProps> = ({ message, isUser }) => {
  const [inference, setInference] = useState<InferenceState | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const { agents, selectedAgentId } = useSelector((state: RootState) => state.agent);
  
  // Obter nome do agente selecionado
  const agentName = selectedAgentId 
    ? agents.find(a => a.id === selectedAgentId)?.name || 'Agente'
    : 'Agente';

  useEffect(() => {
    // Buscar inference para mensagens do usuário
    // O pensamento (inference) é associado à mensagem do usuário, não à resposta do agente
    // Quando o usuário envia uma mensagem, o agente processa e gera um inference associado a essa mensagem
    if (isUser && message.id && !message.id.startsWith('user_')) {
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
          setLoading(false);
        });
    } else {
      // Para mensagens do agente, não buscar inference (o pensamento está associado à mensagem do usuário)
      setInference(null);
      setLoading(false);
    }
  }, [message.id, isUser]);

  const getStateColor = (state: string) => {
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
  };

  const getStateLabel = (state: string) => {
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
  };

  const hasInference = inference !== null && !loading;

  return (
    <Box 
      sx={{ 
        mb: 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: isUser ? 'flex-end' : 'flex-start',
      }}
    >
      {/* Header com Avatar e Nome */}
      <Box 
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1, 
          mb: 0.5,
          flexDirection: isUser ? 'row-reverse' : 'row',
        }}
      >
        <Avatar
          sx={{
            width: 32,
            height: 32,
            bgcolor: isUser ? 'primary.main' : 'secondary.main',
          }}
        >
          {isUser ? <PersonIcon /> : <SmartToyIcon />}
        </Avatar>
        <Typography 
          variant="caption" 
          sx={{ 
            fontWeight: 600,
            color: 'text.secondary',
          }}
        >
          {isUser ? 'Você' : agentName}
        </Typography>
        <Typography 
          variant="caption" 
          sx={{ 
            color: 'text.secondary',
            opacity: 0.6,
          }}
        >
          {new Date(message.timestamp).toLocaleTimeString()}
        </Typography>
      </Box>

      {/* Mensagem */}
      <Paper
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
                      onClick={() => setExpanded(!expanded)}
                    />
                    <IconButton
                      size="small"
                      onClick={() => setExpanded(!expanded)}
                      sx={{ ml: 'auto', color: 'text.secondary' }}
                    >
                      {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                  </>
                ) : null}
              </Box>
            )}
      </Paper>

      {/* Pensamento expandido (apenas para mensagens do usuário) */}
      {isUser && hasInference && (
        <Collapse in={expanded}>
          <Paper
            elevation={2}
            sx={{
              mt: 1,
              p: 2,
              bgcolor: 'background.paper',
              borderLeft: 3,
              borderColor: `${getStateColor(inference.state)}.main`,
              maxWidth: '80%',
              ml: 0,
              mr: 0, // Alinhar à direita junto com a mensagem do usuário
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <PsychologyIcon color={getStateColor(inference.state) as any} />
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Processo de Pensamento
              </Typography>
              <Chip
                label={getStateLabel(inference.state)}
                size="small"
                color={getStateColor(inference.state)}
                sx={{ ml: 'auto' }}
              />
            </Box>

            {/* Confiança */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary" gutterBottom>
                Confiança: {Math.round(inference.confidence * 100)}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={inference.confidence * 100}
                color={inference.confidence > 0.7 ? 'success' : inference.confidence > 0.4 ? 'warning' : 'error'}
                sx={{ height: 6, borderRadius: 1, mt: 0.5 }}
              />
            </Box>

            {/* Tese */}
            {inference.thesis && (
              <Accordion defaultExpanded sx={{ mb: 1 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LightbulbIcon color="info" />
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      Análise (Tese)
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      <strong>Intenção:</strong> {inference.thesis.intent}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      <strong>Hipótese:</strong> {inference.thesis.hypothesis}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Confiança:</strong> {Math.round(inference.thesis.confidence * 100)}%
                    </Typography>
                  </Box>
                </AccordionDetails>
              </Accordion>
            )}

            {/* Antítese */}
            {inference.antithesis && (
              <Accordion sx={{ mb: 1 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <WarningIcon color="warning" />
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      Contradição (Antítese)
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Box>
                    {inference.antithesis.contradictions && inference.antithesis.contradictions.length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          <strong>Contradições identificadas:</strong>
                        </Typography>
                        <List dense>
                          {inference.antithesis.contradictions.map((contradiction, index) => (
                            <ListItem key={index} sx={{ py: 0.5 }}>
                              <ListItemText
                                primary={contradiction}
                                primaryTypographyProps={{ variant: 'body2' }}
                              />
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                    )}
                    {inference.antithesis.alternative_intent && (
                      <Typography variant="body2" color="text.secondary">
                        <strong>Intenção alternativa:</strong> {inference.antithesis.alternative_intent}
                      </Typography>
                    )}
                  </Box>
                </AccordionDetails>
              </Accordion>
            )}

            {/* Síntese */}
            {inference.synthesis && (
              <Accordion defaultExpanded sx={{ mb: 1 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircleIcon color="primary" />
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      Síntese
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      <strong>Intenção Final:</strong> {inference.synthesis.final_intent}
                    </Typography>
                    {inference.synthesis.requires_confirmation && (
                      <Chip
                        label="Requer Confirmação"
                        size="small"
                        color="warning"
                        sx={{ mt: 1, mb: 1 }}
                      />
                    )}
                    {inference.synthesis.action_plan && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          <strong>Plano de Ação:</strong>
                        </Typography>
                        {Array.isArray(inference.synthesis.action_plan) ? (
                          <Box component="ul" sx={{ pl: 2, m: 0 }}>
                            {inference.synthesis.action_plan.map((action, index) => (
                              <Typography key={index} variant="body2" color="text.secondary" component="li" sx={{ mb: 0.5 }}>
                                {action}
                              </Typography>
                            ))}
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            {inference.synthesis.action_plan}
                          </Typography>
                        )}
                      </Box>
                    )}
                  </Box>
                </AccordionDetails>
              </Accordion>
            )}

            <Divider sx={{ my: 1 }} />

            <Typography variant="caption" color="text.secondary">
              {new Date(inference.timestamp).toLocaleString()}
            </Typography>
          </Paper>
        </Collapse>
      )}
    </Box>
  );
};

export default MessageWithInference;

