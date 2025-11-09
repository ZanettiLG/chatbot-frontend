import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Alert,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  Divider,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  QrCode as QrCodeIcon,
} from '@mui/icons-material';
import { RootState } from '../store';
import {
  fetchWhatsAppSessions,
  createWhatsAppSession,
  updateWhatsAppSession,
  deleteWhatsAppSession,
  initializeWhatsAppSession,
  closeWhatsAppSession,
  clearError,
  selectSession,
  setQRCode,
  updateSessionStatus,
  clearQRCode,
} from '../store/whatsappSessionSlice';
import { fetchAgents } from '../store/agentSlice';
import { WhatsAppSession } from '../services/whatsappSessionService';
import { useWhatsAppStatus } from '../hooks/useWhatsAppStatus';
import QRCodeDisplay from './QRCodeDisplay';

const WhatsAppSessionManagement: React.FC = () => {
  const dispatch = useDispatch();
  const { sessions, loading, error, qrCodes } = useSelector((state: RootState) => state.whatsappSession);
  const { agents } = useSelector((state: RootState) => state.agent);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingSession, setEditingSession] = useState<WhatsAppSession | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    agentId: '',
    sessionName: '',
    isActive: true,
  });
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [selectedSessionForQR, setSelectedSessionForQR] = useState<string | null>(null);

  // Conectar ao WebSocket para todas as sessões
  const { socket } = useWhatsAppStatus();

  // Registrar listeners para cada sessão quando elas mudarem
  useEffect(() => {
    if (!socket) return;

    const handlers: Array<() => void> = [];

    sessions.forEach((session) => {
      const qrHandler = (data: { sessionId: string; qrCode: string }) => {
        if (data.sessionId === session.id) {
          dispatch(setQRCode({ sessionId: data.sessionId, qrCode: data.qrCode }));
        }
      };

      const statusHandler = (data: { sessionId: string; status: string; phoneNumber?: string; error?: string }) => {
        if (data.sessionId === session.id) {
          dispatch(updateSessionStatus({
            sessionId: data.sessionId,
            status: data.status,
            phoneNumber: data.phoneNumber,
            error: data.error,
          }));

          if (data.status === 'connected') {
            dispatch(clearQRCode(data.sessionId));
          }
        }
      };

      socket.on(`session:${session.id}:qr`, qrHandler);
      socket.on(`session:${session.id}:status`, statusHandler);

      handlers.push(() => {
        socket.off(`session:${session.id}:qr`, qrHandler);
        socket.off(`session:${session.id}:status`, statusHandler);
      });
    });

    return () => {
      handlers.forEach(cleanup => cleanup());
    };
  }, [socket, sessions, dispatch]);

  useEffect(() => {
    dispatch(fetchWhatsAppSessions() as any);
    dispatch(fetchAgents(true) as any);
  }, [dispatch]);

  const handleOpenDialog = (session?: WhatsAppSession) => {
    if (session) {
      setEditingSession(session);
      setFormData({
        name: session.name,
        agentId: session.agentId,
        sessionName: session.sessionName,
        isActive: session.isActive,
      });
    } else {
      setEditingSession(null);
      setFormData({
        name: '',
        agentId: '',
        sessionName: '',
        isActive: true,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingSession(null);
    setFormData({
      name: '',
      agentId: '',
      sessionName: '',
      isActive: true,
    });
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.agentId) {
      alert('Nome e Agente são obrigatórios');
      return;
    }

    try {
      if (editingSession) {
        await dispatch(updateWhatsAppSession({
          id: editingSession.id,
          data: {
            name: formData.name,
            agentId: formData.agentId,
            isActive: formData.isActive,
          },
        }) as any);
      } else {
        await dispatch(createWhatsAppSession({
          name: formData.name,
          agentId: formData.agentId,
          sessionName: formData.sessionName || undefined,
        }) as any);
      }
      handleCloseDialog();
      dispatch(fetchWhatsAppSessions() as any);
    } catch (error) {
      console.error('Error saving session:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta sessão?')) {
      try {
        await dispatch(deleteWhatsAppSession(id) as any);
        dispatch(fetchWhatsAppSessions() as any);
      } catch (error) {
        console.error('Error deleting session:', error);
      }
    }
  };

  const handleInitialize = async (id: string) => {
    try {
      await dispatch(initializeWhatsAppSession(id) as any);
      setSelectedSessionForQR(id);
      setQrDialogOpen(true);
    } catch (error) {
      console.error('Error initializing session:', error);
      alert('Erro ao inicializar sessão. Verifique se o agente está ativo.');
    }
  };

  const handleClose = async (id: string) => {
    try {
      await dispatch(closeWhatsAppSession(id) as any);
      dispatch(fetchWhatsAppSessions() as any);
    } catch (error) {
      console.error('Error closing session:', error);
    }
  };

  const handleShowQR = (id: string) => {
    setSelectedSessionForQR(id);
    setQrDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'success';
      case 'connecting':
      case 'qr_required':
        return 'warning';
      case 'disconnected':
        return 'default';
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'connected':
        return 'Conectado';
      case 'connecting':
        return 'Conectando...';
      case 'qr_required':
        return 'QR Code Necessário';
      case 'disconnected':
        return 'Desconectado';
      case 'error':
        return 'Erro';
      default:
        return status;
    }
  };

  const selectedSession = selectedSessionForQR ? sessions.find(s => s.id === selectedSessionForQR) : null;
  const selectedSessionQR = selectedSessionForQR ? qrCodes[selectedSessionForQR] : null;

  if (loading && sessions.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={2} sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Gerenciamento de Sessões WhatsApp
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Nova Sessão
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => dispatch(clearError())}>
            {error}
          </Alert>
        )}

        <List>
          {sessions.length === 0 ? (
            <ListItem>
              <ListItemText
                primary="Nenhuma sessão cadastrada"
                secondary="Clique em 'Nova Sessão' para criar uma sessão WhatsApp"
              />
            </ListItem>
          ) : (
            sessions.map((session) => {
              const agent = agents.find(a => a.id === session.agentId);
              const isConnected = session.status === 'connected';
              const isConnecting = session.status === 'connecting' || session.status === 'qr_required';
              const hasQR = qrCodes[session.id] || session.qrCode;

              return (
                <React.Fragment key={session.id}>
                  <ListItem>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                          <Typography variant="h6">{session.name}</Typography>
                          <Chip
                            label={getStatusLabel(session.status)}
                            color={getStatusColor(session.status) as any}
                            size="small"
                          />
                          {session.isActive ? (
                            <Chip label="Ativa" color="success" size="small" />
                          ) : (
                            <Chip label="Inativa" color="default" size="small" />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            Agente: {agent?.name || session.agentId}
                          </Typography>
                          {session.phoneNumber && (
                            <Typography variant="body2" color="text.secondary">
                              Número: {session.phoneNumber}
                            </Typography>
                          )}
                          <Typography variant="body2" color="text.secondary">
                            Session Name: {session.sessionName}
                          </Typography>
                          {session.error && (
                            <Typography variant="body2" color="error">
                              Erro: {session.error}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {!isConnected && !isConnecting && (
                          <IconButton
                            edge="end"
                            color="primary"
                            onClick={() => handleInitialize(session.id)}
                            title="Inicializar sessão"
                          >
                            <PlayIcon />
                          </IconButton>
                        )}
                        {isConnecting && hasQR && (
                          <IconButton
                            edge="end"
                            color="primary"
                            onClick={() => handleShowQR(session.id)}
                            title="Mostrar QR Code"
                          >
                            <QrCodeIcon />
                          </IconButton>
                        )}
                        {isConnected && (
                          <IconButton
                            edge="end"
                            color="error"
                            onClick={() => handleClose(session.id)}
                            title="Fechar sessão"
                          >
                            <StopIcon />
                          </IconButton>
                        )}
                        <IconButton
                          edge="end"
                          onClick={() => handleOpenDialog(session)}
                          title="Editar sessão"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          edge="end"
                          color="error"
                          onClick={() => handleDelete(session.id)}
                          title="Excluir sessão"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </ListItemSecondaryAction>
                  </ListItem>
                  <Divider />
                </React.Fragment>
              );
            })
          )}
        </List>

        {/* Dialog para criar/editar sessão */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            {editingSession ? 'Editar Sessão WhatsApp' : 'Nova Sessão WhatsApp'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <TextField
                label="Nome da Sessão"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                fullWidth
                required
              />
              <FormControl fullWidth required>
                <InputLabel>Agente</InputLabel>
                <Select
                  value={formData.agentId}
                  onChange={(e) => setFormData({ ...formData, agentId: e.target.value })}
                  label="Agente"
                >
                  {agents.filter(a => a.isActive).map((agent) => (
                    <MenuItem key={agent.id} value={agent.id}>
                      {agent.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {!editingSession && (
                <TextField
                  label="Session Name (opcional)"
                  value={formData.sessionName}
                  onChange={(e) => setFormData({ ...formData, sessionName: e.target.value })}
                  fullWidth
                  helperText="Deixe em branco para gerar automaticamente"
                />
              )}
              {editingSession && (
                <TextField
                  label="Session Name"
                  value={editingSession.sessionName}
                  fullWidth
                  disabled
                  helperText="Session Name não pode ser alterado"
                />
              )}
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                }
                label="Sessão Ativa"
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancelar</Button>
            <Button onClick={handleSubmit} variant="contained">
              {editingSession ? 'Salvar' : 'Criar'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Dialog para QR Code */}
        <QRCodeDisplay
          open={qrDialogOpen}
          onClose={() => {
            setQrDialogOpen(false);
            setSelectedSessionForQR(null);
          }}
          qrCode={selectedSessionQR || null}
          loading={selectedSession?.status === 'connecting'}
          sessionName={selectedSession?.name}
        />
      </Paper>
    </Box>
  );
};

export default WhatsAppSessionManagement;

