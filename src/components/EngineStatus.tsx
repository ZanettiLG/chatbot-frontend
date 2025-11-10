import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  Switch,
  FormControlLabel,
  Alert,
  Divider,
  Button,
} from '@mui/material';
import {
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon,
  Phone as PhoneIcon,
  PhoneDisabled as PhoneDisabledIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { RootState } from '../store';
import { fetchWhatsAppSessions } from '../store/whatsappSessionSlice';
import { updateEngineStatus } from '../store/engineSlice';
import { useWhatsAppStatus } from '../hooks/useWhatsAppStatus';
import { useWebSocket } from '../hooks/useWebSocket';

const EngineStatus: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { engines, selectedEngine } = useSelector((state: RootState) => state.engine);
  const { sessions } = useSelector((state: RootState) => state.whatsappSession);
  const { isConnected: websocketConnected } = useSelector((state: RootState) => state.chat);

  // Conectar ao WebSocket para receber atualizações de status
  useWhatsAppStatus();
  useWebSocket({ autoConnect: true });

  // Carregar sessões e sincronizar status inicial ao montar
  useEffect(() => {
    dispatch(fetchWhatsAppSessions() as any);
  }, [dispatch]);

  // Sincronizar status do WebSocket com base no estado atual da conexão
  useEffect(() => {
    dispatch(updateEngineStatus({
      engine: 'websocket',
      status: {
        isConnected: websocketConnected,
        lastActivity: websocketConnected ? new Date().toISOString() : undefined,
      },
    }));
  }, [websocketConnected, dispatch]);

  // Sincronizar status do WhatsApp com base nas sessões carregadas
  useEffect(() => {
    if (sessions.length === 0) {
      // Se não há sessões, garantir que o status está desconectado
      dispatch(updateEngineStatus({
        engine: 'whatsapp',
        status: {
          isConnected: false,
          sessionStatus: 'disconnected',
        },
      }));
      return;
    }

    // Verificar se há alguma sessão conectada
    const connectedSession = sessions.find(s => s.status === 'connected');
    const hasQRCode = sessions.some(s => s.status === 'qr_required');
    const isConnecting = sessions.some(s => s.status === 'connecting');

    if (connectedSession) {
      // Se há pelo menos uma sessão conectada, marcar como conectado
      dispatch(updateEngineStatus({
        engine: 'whatsapp',
        status: {
          isConnected: true,
          sessionStatus: 'connected',
          lastActivity: connectedSession.updatedAt,
        },
      }));
    } else if (hasQRCode) {
      dispatch(updateEngineStatus({
        engine: 'whatsapp',
        status: {
          isConnected: false,
          sessionStatus: 'qr_required',
        },
      }));
    } else if (isConnecting) {
      dispatch(updateEngineStatus({
        engine: 'whatsapp',
        status: {
          isConnected: false,
          sessionStatus: 'connecting',
        },
      }));
    } else {
      // Todas as sessões estão desconectadas
      dispatch(updateEngineStatus({
        engine: 'whatsapp',
        status: {
          isConnected: false,
          sessionStatus: 'disconnected',
        },
      }));
    }
  }, [sessions, dispatch]);

  const getConnectionIcon = (isConnected: boolean, engineType: string) => {
    if (engineType === 'websocket') {
      return isConnected ? <WifiIcon color="success" /> : <WifiOffIcon color="error" />;
    } else {
      return isConnected ? <PhoneIcon color="success" /> : <PhoneDisabledIcon color="error" />;
    }
  };

  const getStatusColor = (isConnected: boolean) => {
    return isConnected ? 'success' : 'error';
  };

  const getStatusText = (isConnected: boolean) => {
    return isConnected ? 'Conectado' : 'Desconectado';
  };

  const getSessionStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'success';
      case 'connecting':
        return 'warning';
      case 'qr_required':
        return 'info';
      case 'disconnected':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Status das Engines
      </Typography>
      
      <Grid container spacing={3}>
        {/* WebSocket Engine */}
        <Grid item xs={12} md={6}>
          <Card 
            sx={{ 
              height: '100%',
              border: selectedEngine === 'websocket' ? 2 : 0,
              borderColor: 'primary.main',
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                {getConnectionIcon(engines.websocket.isConnected, 'websocket')}
                <Typography variant="h5" component="h2" sx={{ ml: 1 }}>
                  WebSocket
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Chip
                  label={getStatusText(engines.websocket.isConnected)}
                  color={getStatusColor(engines.websocket.isConnected)}
                  variant="outlined"
                  sx={{ mb: 1 }}
                />
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Mensagens enviadas: <strong>{engines.websocket.messageCount}</strong>
                </Typography>
                {engines.websocket.lastActivity && (
                  <Typography variant="body2" color="text.secondary">
                    Última atividade: {new Date(engines.websocket.lastActivity).toLocaleTimeString()}
                  </Typography>
                )}
              </Box>

              <Divider sx={{ my: 2 }} />

              <FormControlLabel
                control={
                  <Switch
                    checked={engines.websocket.isEnabled}
                    disabled
                    color="primary"
                  />
                }
                label="Engine Habilitada"
              />
            </CardContent>
          </Card>
        </Grid>

        {/* WhatsApp Engine */}
        <Grid item xs={12} md={6}>
          <Card 
            sx={{ 
              height: '100%',
              border: selectedEngine === 'whatsapp' ? 2 : 0,
              borderColor: 'primary.main',
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                {getConnectionIcon(engines.whatsapp.isConnected, 'whatsapp')}
                <Typography variant="h5" component="h2" sx={{ ml: 1 }}>
                  WhatsApp
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Chip
                  label={getStatusText(engines.whatsapp.isConnected)}
                  color={getStatusColor(engines.whatsapp.isConnected)}
                  variant="outlined"
                  sx={{ mb: 1 }}
                />
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Mensagens enviadas: <strong>{engines.whatsapp.messageCount}</strong>
                </Typography>
                {engines.whatsapp.lastActivity && (
                  <Typography variant="body2" color="text.secondary">
                    Última atividade: {new Date(engines.whatsapp.lastActivity).toLocaleTimeString()}
                  </Typography>
                )}
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Status da Sessão:
                </Typography>
                <Chip
                  label={engines.whatsapp.sessionStatus}
                  color={getSessionStatusColor(engines.whatsapp.sessionStatus)}
                  variant="outlined"
                  size="small"
                />
              </Box>

              {engines.whatsapp.qrCode && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  QR Code disponível para autenticação
                </Alert>
              )}

              <Divider sx={{ my: 2 }} />

              <FormControlLabel
                control={
                  <Switch
                    checked={engines.whatsapp.isEnabled}
                    disabled
                    color="primary"
                  />
                }
                label="Engine Habilitada"
              />

              <Divider sx={{ my: 2 }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Sessões: <strong>{sessions.length}</strong>
                  </Typography>
                  {sessions.length > 0 && (
                    <Typography variant="body2" color="text.secondary">
                      Conectadas: <strong>{sessions.filter(s => s.status === 'connected').length}</strong>
                    </Typography>
                  )}
                </Box>
                       <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                         <Button
                           variant="outlined"
                           size="small"
                           startIcon={<SettingsIcon />}
                           onClick={() => navigate('/whatsapp-sessions')}
                         >
                           Gerenciar Sessões
                         </Button>
                         <Button
                           variant="outlined"
                           size="small"
                           onClick={() => navigate('/conversations')}
                         >
                           Ver Conversas
                         </Button>
                       </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default EngineStatus;
