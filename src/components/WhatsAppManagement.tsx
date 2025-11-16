import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Divider from '@mui/material/Divider';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import PlayIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import QrCodeIcon from '@mui/icons-material/QrCode';
import RefreshIcon from '@mui/icons-material/Refresh';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import { RootState } from '../store';
import {
  fetchWhatsAppSessions,
  createWhatsAppSession,
  updateWhatsAppSession,
  deleteWhatsAppSession,
  initializeWhatsAppSession,
  closeWhatsAppSession,
  cancelWhatsAppSessionInitialization,
  clearError,
  setQRCode,
  updateSessionStatus,
  clearQRCode,
} from '../store/whatsappSessionSlice';
import { fetchAgents } from '../store/agentSlice';
import { WhatsAppSession } from '../services/whatsappSessionService';
import { useWhatsAppStatus } from '../hooks/useWhatsAppStatus';
import { useToast } from '../hooks/useToast';
import EmptyState from './EmptyState';
import ListSkeleton from './ListSkeleton';
import QRCodeDisplay from './QRCodeDisplay';

const WhatsAppManagement: React.FC = () => {
  const dispatch = useDispatch();
  const { sessions, loading, error, qrCodes } = useSelector((state: RootState) => state.whatsappSession);
  const { agents } = useSelector((state: RootState) => state.agent);
  const { showSuccess, showError, showInfo } = useToast();
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

  // Carregar dados iniciais
  useEffect(() => {
    dispatch(fetchWhatsAppSessions() as any);
    dispatch(fetchAgents(true) as any);
  }, [dispatch]);

  // Registrar listeners para cada sessão quando elas mudarem
  useEffect(() => {
    if (!socket) {
      return;
    }
    
    const registerAllListeners = () => {
      const handlers: Array<() => void> = [];
      const sessionIdMap = new Map<string, string>();
      
      sessions.forEach((session) => {
        sessionIdMap.set(session.id, session.id);
        if (!session.id.startsWith('whatsapp_')) {
          sessionIdMap.set(`whatsapp_${session.id}`, session.id);
        }
      });

      const qrHandler = (data: { sessionId: string; qrCode: string }) => {
        if (!data || !data.sessionId || !data.qrCode) {
          return;
        }
        
        let matchedSessionId: string | undefined = sessionIdMap.get(data.sessionId);
        
        if (!matchedSessionId && data.sessionId.startsWith('whatsapp_')) {
          const withoutPrefix = data.sessionId.replace(/^whatsapp_/, '');
          matchedSessionId = sessionIdMap.get(withoutPrefix);
        }
        
        if (!matchedSessionId) {
          const withPrefix = `whatsapp_${data.sessionId}`;
          matchedSessionId = sessionIdMap.get(withPrefix);
        }
        
        if (!matchedSessionId) {
          const foundSession = sessions.find(s => 
            s.id === data.sessionId || 
            s.id === `whatsapp_${data.sessionId}` || 
            `whatsapp_${s.id}` === data.sessionId
          );
          if (foundSession) {
            matchedSessionId = foundSession.id;
          } else {
            matchedSessionId = data.sessionId;
          }
        }

        dispatch(setQRCode({ sessionId: matchedSessionId, qrCode: data.qrCode }));
        
        const matchedSession = sessions.find(s => s.id === matchedSessionId);
        if (matchedSession && matchedSession.status !== 'qr_required') {
          dispatch(updateSessionStatus({
            sessionId: matchedSessionId,
            status: 'qr_required',
          }));
        }
      };

      const statusHandler = (data: { sessionId: string; status: string; phoneNumber?: string; error?: string }) => {
        const matchedSession = sessions.find(s => 
          s.id === data.sessionId || 
          s.id === `whatsapp_${data.sessionId}` || 
          `whatsapp_${s.id}` === data.sessionId
        );
        
        if (matchedSession) {
          const matchedSessionId = matchedSession.id;
          dispatch(updateSessionStatus({
            sessionId: matchedSessionId,
            status: data.status,
            phoneNumber: data.phoneNumber,
            error: data.error,
          }));
          
          if (data.status === 'connected') {
            dispatch(clearQRCode(matchedSessionId));
          }
        }
      };

      sessions.forEach((session) => {
        socket.on(`session:${session.id}:qr`, qrHandler);
        socket.on(`session:${session.id}:status`, statusHandler);
        socket.on(`session:whatsapp_${session.id}:qr`, qrHandler);
        socket.on(`session:whatsapp_${session.id}:status`, statusHandler);

        handlers.push(() => {
          socket.off(`session:${session.id}:qr`, qrHandler);
          socket.off(`session:${session.id}:status`, statusHandler);
          socket.off(`session:whatsapp_${session.id}:qr`, qrHandler);
          socket.off(`session:whatsapp_${session.id}:status`, statusHandler);
        });
      });
      
      return () => {
        handlers.forEach(cleanup => cleanup());
      };
    };
    
    if (socket.connected) {
      const cleanup = registerAllListeners();
      return cleanup;
    } else {
      const connectHandler = () => {
        registerAllListeners();
      };
      socket.on('connect', connectHandler);
      
      const timeoutId = setTimeout(() => {
        if (socket.connected) {
          registerAllListeners();
        }
      }, 1000);
      
      return () => {
        socket.off('connect', connectHandler);
        clearTimeout(timeoutId);
      };
    }
  }, [socket, sessions, dispatch]);

  // Monitorar mudanças no QR code e atualizar automaticamente
  useEffect(() => {
    for (const sessionId in qrCodes) {
      const session = sessions.find(s => 
        s.id === sessionId || 
        s.id === `whatsapp_${sessionId}` || 
        `whatsapp_${s.id}` === sessionId
      );
      
      if (session && (session.error || session.status === 'qr_required' || session.status === 'connecting')) {
        const sessionIdToUse = session.id;
        if (!qrDialogOpen || selectedSessionForQR !== sessionIdToUse) {
          setSelectedSessionForQR(sessionIdToUse);
          setQrDialogOpen(true);
          break;
        }
      }
    }
  }, [qrCodes, sessions, qrDialogOpen, selectedSessionForQR]);

  // Fechar modal automaticamente quando a sessão estiver conectada
  useEffect(() => {
    const selectedSession = selectedSessionForQR ? sessions.find(s => s.id === selectedSessionForQR) : null;
    if (selectedSession && selectedSession.status === 'connected' && qrDialogOpen) {
      setQrDialogOpen(false);
      setSelectedSessionForQR(null);
      if (selectedSessionForQR) {
        dispatch(clearQRCode(selectedSessionForQR));
      }
    }
  }, [sessions, qrDialogOpen, selectedSessionForQR, dispatch]);

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
      showError('Nome e Agente são obrigatórios');
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
        showSuccess('Sessão atualizada com sucesso!');
      } else {
        await dispatch(createWhatsAppSession({
          name: formData.name,
          agentId: formData.agentId,
          sessionName: formData.sessionName || undefined,
        }) as any);
        showSuccess('Sessão criada com sucesso!');
      }
      handleCloseDialog();
      dispatch(fetchWhatsAppSessions() as any);
    } catch (error: any) {
      console.error('Error saving session:', error);
      const errorMessage = error?.message || error?.toString() || 'Erro ao salvar sessão';
      showError(`Erro ao salvar sessão: ${errorMessage}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta sessão?')) {
      try {
        await dispatch(deleteWhatsAppSession(id) as any);
        showSuccess('Sessão excluída com sucesso!');
        dispatch(fetchWhatsAppSessions() as any);
      } catch (error: any) {
        console.error('Error deleting session:', error);
        const errorMessage = error?.message || error?.toString() || 'Erro ao excluir sessão';
        showError(`Erro ao excluir sessão: ${errorMessage}`);
      }
    }
  };

  const handleInitialize = async (id: string) => {
    try {
      await dispatch(initializeWhatsAppSession(id) as any);
      setSelectedSessionForQR(id);
      setQrDialogOpen(true);
      showInfo('Inicializando sessão... Aguarde o QR Code.');
    } catch (error: any) {
      console.error('Error initializing session:', error);
      const errorMessage = error?.message || error?.toString() || 'Erro ao inicializar sessão';
      showError(`Erro ao inicializar sessão: ${errorMessage}. Verifique se o agente está ativo.`);
    }
  };

  const handleClose = async (id: string) => {
    try {
      await dispatch(closeWhatsAppSession(id) as any);
      showSuccess('Sessão desconectada com sucesso!');
      dispatch(fetchWhatsAppSessions() as any);
    } catch (error: any) {
      console.error('Error closing session:', error);
      const errorMessage = error?.message || error?.toString() || 'Erro ao desconectar sessão';
      showError(`Erro ao desconectar sessão: ${errorMessage}`);
    }
  };

  const handleShowQR = async (id: string) => {
    const session = sessions.find(s => s.id === id);
    
    if (session && session.status !== 'connected' && session.status !== 'connecting' && session.status !== 'qr_required') {
      try {
        await dispatch(initializeWhatsAppSession(id) as any);
        showInfo('Inicializando sessão... Aguarde o QR Code.');
      } catch (error: any) {
        console.error('Error initializing session:', error);
        const errorMessage = error?.message || error?.toString() || 'Erro ao inicializar sessão';
        showError(`Erro ao inicializar sessão: ${errorMessage}. Verifique se o agente está ativo.`);
        return;
      }
    }
    
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
  
  const selectedSessionQR = selectedSessionForQR ? (() => {
    if (qrCodes[selectedSessionForQR]) {
      return qrCodes[selectedSessionForQR];
    }
    
    const withoutPrefix = selectedSessionForQR.startsWith('whatsapp_') 
      ? selectedSessionForQR.replace(/^whatsapp_/, '') 
      : null;
    const withPrefix = !selectedSessionForQR.startsWith('whatsapp_') 
      ? `whatsapp_${selectedSessionForQR}` 
      : null;
    
    if (withoutPrefix && qrCodes[withoutPrefix]) {
      return qrCodes[withoutPrefix];
    }
    
    if (withPrefix && qrCodes[withPrefix]) {
      return qrCodes[withPrefix];
    }
    
    for (const key in qrCodes) {
      if (key === selectedSessionForQR || 
          key === withoutPrefix || 
          key === withPrefix ||
          key.includes(selectedSessionForQR) || 
          selectedSessionForQR.includes(key)) {
        return qrCodes[key];
      }
    }
    
    return null;
  })() : null;


  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Gerenciamento de Sessões WhatsApp
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Gerencie suas sessões WhatsApp e conecte seus agentes
      </Typography>

      {/* Seção de Gerenciamento de Sessões */}
      <Paper elevation={2} sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" component="h2">
            Gerenciamento de Sessões
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

        {loading && sessions.length === 0 ? (
          <ListSkeleton count={3} hasSecondary={true} hasAction={true} />
        ) : !loading && sessions.length === 0 ? (
          <EmptyState
            icon={<WhatsAppIcon />}
            title="Nenhuma sessão WhatsApp cadastrada"
            description="Crie uma sessão WhatsApp para conectar seus agentes ao WhatsApp. Cada sessão permite que um agente interaja com usuários através do WhatsApp."
            actionLabel="Criar Primeira Sessão"
            onAction={() => handleOpenDialog()}
            size="medium"
          />
        ) : (
          <List>
            {sessions.map((session) => {
              const agent = agents.find(a => a.id === session.agentId);
              const isConnected = session.status === 'connected';
              const isConnecting = session.status === 'connecting' || session.status === 'qr_required';
              const hasError = !!session.error;
              const hasQR = qrCodes[session.id] || session.qrCode;
              
              const getMainActionButton = () => {
                if (isConnected) {
                  return (
                    <IconButton
                      edge="end"
                      color="error"
                      onClick={() => handleClose(session.id)}
                      title="Desconectar WhatsApp"
                    >
                      <StopIcon />
                    </IconButton>
                  );
                } else if (isConnecting && hasQR) {
                  return (
                    <IconButton
                      edge="end"
                      color="primary"
                      onClick={() => handleShowQR(session.id)}
                      title="Ver QR Code"
                    >
                      <QrCodeIcon />
                    </IconButton>
                  );
                } else if (isConnecting && !hasQR) {
                  return (
                    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                      <IconButton
                        edge="end"
                        color="primary"
                        disabled
                        title="Aguardando QR Code..."
                      >
                        <QrCodeIcon />
                      </IconButton>
                      <CircularProgress
                        size={24}
                        sx={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          marginTop: '-12px',
                          marginLeft: '-12px',
                        }}
                      />
                    </Box>
                  );
                } else if (hasError) {
                  return (
                    <IconButton
                      edge="end"
                      color="warning"
                      onClick={() => handleInitialize(session.id)}
                      title="Reconectar"
                    >
                      <RefreshIcon />
                    </IconButton>
                  );
                } else {
                  return (
                    <IconButton
                      edge="end"
                      color="primary"
                      onClick={() => handleInitialize(session.id)}
                      title="Conectar WhatsApp"
                    >
                      <PlayIcon />
                    </IconButton>
                  );
                }
              };

              return (
                <React.Fragment key={session.id}>
                  <ListItem>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }} component="span">
                          <Typography variant="h6" component="span">{session.name}</Typography>
                          <Chip
                            label={getStatusLabel(session.status)}
                            color={getStatusColor(session.status) as any}
                            size="small"
                          />
                        </Box>
                      }
                      secondary={
                        <Box sx={{ mt: 1 }} component="span">
                          <Typography variant="body2" color="text.secondary" component="span" display="block">
                            Agente: {agent?.name || session.agentId}
                          </Typography>
                          {session.phoneNumber && (
                            <Typography variant="body2" color="text.secondary" component="span" display="block">
                              Conectado ao WhatsApp: {session.phoneNumber}
                            </Typography>
                          )}
                          {session.error && (
                            <Typography variant="body2" color="error" component="span" display="block" sx={{ mt: 0.5 }}>
                              ⚠️ {session.error}
                            </Typography>
                          )}
                          {isConnecting && !hasQR && (
                            <Typography variant="body2" color="text.secondary" component="span" display="block" sx={{ mt: 0.5, fontStyle: 'italic' }}>
                              ⏳ Gerando QR Code para conexão...
                            </Typography>
                          )}
                          {isConnecting && hasQR && (
                            <Typography variant="body2" color="primary" component="span" display="block" sx={{ mt: 0.5, fontWeight: 'medium' }}>
                              📱 QR Code pronto! Clique no ícone acima para escanear com seu WhatsApp
                            </Typography>
                          )}
                          {!isConnected && !isConnecting && !hasError && (
                            <Typography variant="body2" color="text.secondary" component="span" display="block" sx={{ mt: 0.5, fontStyle: 'italic' }}>
                              Clique no botão de conexão para vincular seu WhatsApp
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                        {getMainActionButton()}
                        <IconButton
                          edge="end"
                          onClick={() => handleOpenDialog(session)}
                          title="Editar sessão"
                          size="small"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          edge="end"
                          color="error"
                          onClick={() => handleDelete(session.id)}
                          title="Excluir sessão"
                          size="small"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </ListItemSecondaryAction>
                  </ListItem>
                  <Divider />
                </React.Fragment>
              );
            })}
          </List>
        )}

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
          onClose={async () => {
            if (selectedSessionForQR && selectedSession && 
                (selectedSession.status === 'connecting' || selectedSession.status === 'qr_required')) {
              try {
                await dispatch(cancelWhatsAppSessionInitialization(selectedSessionForQR) as any);
              } catch (error) {
                console.error('Error canceling initialization:', error);
              }
            }
            
            setQrDialogOpen(false);
            setSelectedSessionForQR(null);
            if (selectedSessionForQR) {
              dispatch(clearQRCode(selectedSessionForQR));
            }
          }}
          qrCode={selectedSessionQR || null}
          loading={!selectedSessionQR && (selectedSession?.status === 'connecting' || selectedSession?.status === 'qr_required')}
          sessionName={selectedSession?.name}
          sessionStatus={selectedSession?.status}
          onRegenerateQR={() => {
            if (selectedSessionForQR) {
              handleInitialize(selectedSessionForQR);
            }
          }}
        />
      </Paper>
    </Box>
  );
};

export default WhatsAppManagement;

