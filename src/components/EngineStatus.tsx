import React from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  Switch,
  FormControlLabel,
  LinearProgress,
  Alert,
  Divider,
} from '@mui/material';
import {
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon,
  Phone as PhoneIcon,
  PhoneDisabled as PhoneDisabledIcon,
} from '@mui/icons-material';
import { RootState } from '../store';

const EngineStatus: React.FC = () => {
  const { engines, selectedEngine } = useSelector((state: RootState) => state.engine);

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
                    Última atividade: {engines.websocket.lastActivity.toLocaleTimeString()}
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
                    Última atividade: {engines.whatsapp.lastActivity.toLocaleTimeString()}
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
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default EngineStatus;
