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
  Divider,
} from '@mui/material';
import {
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon,
  Storage as StorageIcon,
  CloudQueue as CloudQueueIcon,
  Settings as SettingsIcon,
  Psychology as PsychologyIcon,
  WhatsApp as WhatsAppIcon,
} from '@mui/icons-material';
import { RootState } from '../store';
import { updateEngineStatus } from '../store/engineSlice';
import { useWebSocket } from '../hooks/useWebSocket';

const EngineStatus: React.FC = () => {
  const dispatch = useDispatch();
  const { engines } = useSelector((state: RootState) => state.engine);
  const { isConnected: websocketConnected } = useSelector((state: RootState) => state.chat);
  const { sessions } = useSelector((state: RootState) => state.whatsappSession);

  // Conectar ao WebSocket para receber atualizações de status
  useWebSocket({ autoConnect: true });

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
      dispatch(updateEngineStatus({
        engine: 'whatsapp',
        status: {
          isConnected: false,
          sessionStatus: 'disconnected',
        },
      }));
      return;
    }

    const connectedSession = sessions.find(s => s.status === 'connected');
    const hasQRCode = sessions.some(s => s.status === 'qr_required');
    const isConnecting = sessions.some(s => s.status === 'connecting');

    if (connectedSession) {
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
      dispatch(updateEngineStatus({
        engine: 'whatsapp',
        status: {
          isConnected: false,
          sessionStatus: 'disconnected',
        },
      }));
    }
  }, [sessions, dispatch]);


  const getStatusColor = (isConnected: boolean) => {
    return isConnected ? 'success' : 'error';
  };

  const getStatusText = (isConnected: boolean) => {
    return isConnected ? 'Conectado' : 'Desconectado';
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Configurações
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Gerencie o status das engines e configurações gerais do sistema
      </Typography>
      
      <Grid container spacing={3}>
        {/* WebSocket Engine */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                {engines.websocket.isConnected ? (
                  <WifiIcon color="success" />
                ) : (
                  <WifiOffIcon color="error" />
                )}
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
            </CardContent>
          </Card>
        </Grid>

        {/* Database/PostgreSQL */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <StorageIcon color="primary" />
                <Typography variant="h5" component="h2" sx={{ ml: 1 }}>
                  Database (PostgreSQL)
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Chip
                  label="Conectado"
                  color="success"
                  variant="outlined"
                  sx={{ mb: 1 }}
                />
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Host: <strong>localhost</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Porta: <strong>5432</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Database: <strong>salveai_db</strong>
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Redis */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CloudQueueIcon color="primary" />
                <Typography variant="h5" component="h2" sx={{ ml: 1 }}>
                  Redis
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Chip
                  label="Conectado"
                  color="success"
                  variant="outlined"
                  sx={{ mb: 1 }}
                />
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Host: <strong>localhost</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Porta: <strong>6379</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  TTL Padrão: <strong>1800s</strong>
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Kafka */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <SettingsIcon color="primary" />
                <Typography variant="h5" component="h2" sx={{ ml: 1 }}>
                  Kafka
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Chip
                  label="Conectado"
                  color="success"
                  variant="outlined"
                  sx={{ mb: 1 }}
                />
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Brokers: <strong>localhost:9092</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Client ID: <strong>salveai-client</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Group ID: <strong>salveai-group</strong>
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* OpenAI Configuration */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PsychologyIcon color="primary" />
                <Typography variant="h5" component="h2" sx={{ ml: 1 }}>
                  OpenAI
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Modelo: <strong>gpt-4o-mini</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Temperature: <strong>0.7</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Max Tokens: <strong>1000</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Embedding Model: <strong>text-embedding-3-small</strong>
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <FormControlLabel
                control={
                  <Switch
                    checked={true}
                    onChange={(e) => {
                      // TODO: Implementar toggle quando API estiver disponível
                      console.log('OpenAI toggle:', e.target.checked);
                    }}
                    color="primary"
                  />
                }
                label="OpenAI Habilitado"
              />
            </CardContent>
          </Card>
        </Grid>

        {/* WhatsApp */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                {engines.whatsapp.isConnected ? (
                  <WhatsAppIcon color="success" />
                ) : (
                  <WhatsAppIcon color="error" />
                )}
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
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Status da Sessão: <strong>{engines.whatsapp.sessionStatus}</strong>
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <FormControlLabel
                control={
                  <Switch
                    checked={engines.whatsapp.isEnabled}
                    onChange={(e) => {
                      dispatch(updateEngineStatus({
                        engine: 'whatsapp',
                        status: {
                          isEnabled: e.target.checked,
                        },
                      }));
                    }}
                    color="primary"
                  />
                }
                label="WhatsApp Habilitado"
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default EngineStatus;
