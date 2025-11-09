import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { io, Socket } from 'socket.io-client';
import config from '../config/env';
import { setQRCode, updateSessionStatus, clearQRCode } from '../store/whatsappSessionSlice';
import { updateEngineStatus } from '../store/engineSlice';

export const useWhatsAppStatus = (sessionId?: string) => {
  const dispatch = useDispatch();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Conectar ao namespace do WhatsApp Status
    const socket = io(`${config.wsUrl}/whatsapp-status`, {
      query: sessionId ? { sessionId } : {},
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    // Listener para QR Code - usar pattern matching do Socket.IO
    const qrHandler = (data: { sessionId: string; qrCode: string }) => {
      if (!sessionId || data.sessionId === sessionId) {
        dispatch(setQRCode({ sessionId: data.sessionId, qrCode: data.qrCode }));
      }
    };

    // Listener para mudanças de status
    const statusHandler = (data: { sessionId: string; status: string; phoneNumber?: string; error?: string }) => {
      if (!sessionId || data.sessionId === sessionId) {
        dispatch(updateSessionStatus({
          sessionId: data.sessionId,
          status: data.status,
          phoneNumber: data.phoneNumber,
          error: data.error,
        }));

        // Atualizar engineSlice quando status mudar
        const isConnected = data.status === 'connected';
        dispatch(updateEngineStatus({
          engine: 'whatsapp',
          status: {
            isConnected,
            sessionStatus: data.status as 'disconnected' | 'connecting' | 'connected' | 'qr_required',
            lastActivity: isConnected ? new Date().toISOString() : undefined,
          },
        }));

        // Limpar QR Code se conectado
        if (data.status === 'connected') {
          dispatch(clearQRCode(data.sessionId));
        }
      }
    };

    // Escutar eventos específicos se sessionId fornecido
    if (sessionId) {
      socket.on(`session:${sessionId}:qr`, qrHandler);
      socket.on(`session:${sessionId}:status`, statusHandler);
    } else {
      // Se não há sessionId, vamos escutar eventos genéricos
      // O backend emite eventos no formato session:{sessionId}:qr e session:{sessionId}:status
      // Vamos usar uma abordagem diferente: escutar eventos quando as sessões forem conhecidas
      // Por enquanto, vamos usar um listener genérico que será atualizado quando necessário
      // Isso será feito no componente que usa o hook
    }

    socket.on('connect', () => {
      console.log('WhatsApp Status WebSocket connected');
    });

    socket.on('disconnect', () => {
      console.log('WhatsApp Status WebSocket disconnected');
    });

    socket.on('connect_error', (error) => {
      console.error('WhatsApp Status WebSocket connection error:', error);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [sessionId, dispatch]);

  return {
    socket: socketRef.current,
  };
};

