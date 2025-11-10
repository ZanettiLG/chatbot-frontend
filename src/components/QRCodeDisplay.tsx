import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

interface QRCodeDisplayProps {
  open: boolean;
  onClose: () => void;
  qrCode: string | null;
  loading?: boolean;
  sessionName?: string;
  sessionStatus?: 'disconnected' | 'connecting' | 'qr_required' | 'connected' | 'error';
  onRegenerateQR?: () => void;
}

const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  open,
  onClose,
  qrCode,
  loading = false,
  sessionName,
  sessionStatus,
  onRegenerateQR,
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">QR Code para Autenticação WhatsApp</Typography>
          <Button onClick={onClose} size="small" startIcon={<CloseIcon />}>
            Fechar
          </Button>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          {loading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 4 }}>
              <CircularProgress />
              <Typography variant="body2" color="text.secondary">
                Aguardando QR Code...
              </Typography>
            </Box>
          ) : qrCode ? (
            <>
              <Alert severity="info" sx={{ width: '100%' }}>
                Escaneie este QR Code com seu WhatsApp para conectar a sessão
                {sessionName && ` "${sessionName}"`}.
              </Alert>
              <Box
                sx={{
                  p: 2,
                  border: '1px solid #e0e0e0',
                  borderRadius: 2,
                  backgroundColor: '#fff',
                }}
              >
                <img
                  src={qrCode}
                  alt="QR Code"
                  style={{
                    width: '100%',
                    maxWidth: '300px',
                    height: 'auto',
                    display: 'block',
                  }}
                />
              </Box>
              <Typography variant="body2" color="text.secondary" align="center">
                1. Abra o WhatsApp no seu celular
                <br />
                2. Toque em Menu ou Configurações e selecione "Aparelhos conectados"
                <br />
                3. Toque em "Conectar um aparelho"
                <br />
                4. Aponte seu celular para esta tela para capturar o código
              </Typography>
            </>
          ) : (
            <>
              <Alert severity="warning" sx={{ width: '100%' }}>
                QR Code não disponível. 
                {sessionStatus === 'error' || sessionStatus === 'disconnected' 
                  ? ' A sessão pode ter expirado ou ocorreu um erro.'
                  : sessionStatus === 'connected'
                  ? ' A sessão já está conectada.'
                  : ' Tente inicializar a sessão novamente.'}
              </Alert>
              {onRegenerateQR && sessionStatus !== 'connected' && (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={onRegenerateQR}
                  sx={{ mt: 2 }}
                >
                  Gerar Novo QR Code
                </Button>
              )}
            </>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained">
          Fechar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default QRCodeDisplay;

