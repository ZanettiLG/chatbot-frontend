import React, { useState, useEffect } from 'react';
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
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Grid from '@mui/material/Grid';
import PsychologyIcon from '@mui/icons-material/Psychology';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import RefreshIcon from '@mui/icons-material/Refresh';
import { inferenceService, InferenceState } from '../services/inferenceService';
import { conversationService, Conversation } from '../services/conversationService';
import InferenceStateView from './InferenceStateView';
import EmptyState from './EmptyState';
import ListSkeleton from './ListSkeleton';

const InferenceManagement: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [inferenceHistory, setInferenceHistory] = useState<InferenceState[]>([]);
  const [latestInference, setLatestInference] = useState<InferenceState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (selectedSessionId) {
      loadInferenceData(selectedSessionId);
    }
  }, [selectedSessionId]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRefresh && selectedSessionId) {
      interval = setInterval(() => {
        loadLatestInference(selectedSessionId);
      }, 3000); // Atualizar a cada 3 segundos
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, selectedSessionId]);

  const loadConversations = async () => {
    try {
      const data = await conversationService.getAll();
      setConversations(data);
    } catch (err) {
      console.error('Error loading conversations:', err);
    }
  };

  const loadInferenceData = async (sessionId: string) => {
    setLoading(true);
    setError(null);
    try {
      const [history, latest] = await Promise.all([
        inferenceService.getHistory(sessionId, 20),
        inferenceService.getLatest(sessionId),
      ]);
      setInferenceHistory(history || []);
      setLatestInference(latest);
      // Se não houver dados, não é um erro - apenas não há inferências ainda
      if (history.length === 0 && !latest) {
        // Limpar erro se não houver dados (caso normal)
        setError(null);
      }
    } catch (err: any) {
      // Só mostrar erro se for um erro real, não apenas ausência de dados
      if (err.message && !err.message.includes('404')) {
        setError(err.message || 'Erro ao carregar dados de inferência');
        console.error('Error loading inference data:', err);
      } else {
        setError(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadLatestInference = async (sessionId: string) => {
    try {
      const latest = await inferenceService.getLatest(sessionId);
      setLatestInference(latest);
    } catch (err) {
      console.error('Error loading latest inference:', err);
    }
  };

  const handleRefresh = () => {
    if (selectedSessionId) {
      loadInferenceData(selectedSessionId);
    }
  };

  const selectedConversation = conversations.find(
    (c) => c.sessionId === selectedSessionId
  );

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Estados de Inferência Dialética
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Visualize o processo de pensamento dos agentes em tempo real
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Sidebar com conversas */}
        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Conversas</Typography>
              <Button
                size="small"
                startIcon={<RefreshIcon />}
                onClick={loadConversations}
              >
                Atualizar
              </Button>
            </Box>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Selecione uma conversa</InputLabel>
              <Select
                value={selectedSessionId || ''}
                onChange={(e) => setSelectedSessionId(e.target.value as string)}
                label="Selecione uma conversa"
              >
                {conversations.map((conv) => (
                  <MenuItem key={conv.id} value={conv.sessionId}>
                    {conv.contactName || conv.contactIdentifier} ({conv.provider})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {selectedConversation && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Agente:</strong> {selectedConversation.agentId}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Status:</strong> {selectedConversation.status}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Mensagens:</strong> {selectedConversation.messageCount}
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Área principal */}
        <Grid item xs={12} md={8}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {!selectedSessionId ? (
            <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
              <PsychologyIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Selecione uma conversa
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Escolha uma conversa da lista para visualizar os estados de inferência
              </Typography>
            </Paper>
          ) : loading ? (
            <ListSkeleton count={3} />
          ) : inferenceHistory.length === 0 && !latestInference ? (
            <EmptyState
              icon={<PsychologyIcon />}
              title="Nenhum estado de inferência encontrado"
              description="Esta conversa ainda não possui estados de inferência dialética registrados"
            />
          ) : (
            <Box>
              {/* Controles */}
              <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle1">
                    {inferenceHistory.length} estado(s) de inferência
                  </Typography>
                  <Box>
                    <Button
                      size="small"
                      startIcon={<RefreshIcon />}
                      onClick={handleRefresh}
                      sx={{ mr: 1 }}
                    >
                      Atualizar
                    </Button>
                    <Button
                      size="small"
                      variant={autoRefresh ? 'contained' : 'outlined'}
                      onClick={() => setAutoRefresh(!autoRefresh)}
                    >
                      Auto-refresh
                    </Button>
                  </Box>
                </Box>
              </Paper>

              {/* Estado mais recente */}
              {latestInference && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Estado Atual
                  </Typography>
                  <InferenceStateView inferenceState={latestInference} />
                </Box>
              )}

              {/* Histórico */}
              {inferenceHistory.length > 0 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Histórico
                  </Typography>
                  {inferenceHistory.map((state) => (
                    <InferenceStateView key={state.id} inferenceState={state} compact={false} />
                  ))}
                </Box>
              )}
            </Box>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default InferenceManagement;

