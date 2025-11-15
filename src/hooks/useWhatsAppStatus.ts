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
    // Socket.IO adiciona automaticamente /socket.io/, então usar apenas a URL base
    const socket = io(`${config.wsUrl}/whatsapp-status`, {
      query: sessionId ? { sessionId } : {},
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;
    
    console.log('🔌 useWhatsAppStatus: Socket created, connecting to /whatsapp-status namespace');

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
      console.log(`📡 Registering specific listeners for session: ${sessionId}`);
      socket.on(`session:${sessionId}:qr`, qrHandler);
      socket.on(`session:${sessionId}:status`, statusHandler);
    } else {
      // Se não há sessionId, escutar todos os eventos usando uma abordagem diferente
      // Vamos usar uma função que intercepta todos os eventos e filtra pelos que nos interessam
      console.log('📡 Setting up generic WhatsApp status listeners (no sessionId provided)');
      
      // Criar um listener genérico que captura qualquer evento
      // Socket.IO não suporta wildcards, mas podemos usar uma abordagem de interceptação
      // Vamos registrar listeners dinamicamente quando recebermos eventos
      
      // Por enquanto, vamos usar uma abordagem mais simples:
      // Escutar eventos com um padrão conhecido usando uma função wrapper
      const createGenericListener = (eventPattern: string, handler: (data: any) => void) => {
        // Tentar escutar eventos que correspondem ao padrão
        // Como não podemos usar wildcards, vamos usar uma abordagem diferente:
        // Vamos escutar eventos específicos que serão registrados dinamicamente no componente
        // Por enquanto, vamos apenas logar que estamos esperando eventos genéricos
        console.log(`📡 Waiting for events matching pattern: ${eventPattern}`);
      };
      
      // Nota: Os listeners específicos serão registrados no componente WhatsAppSessionManagement
      // Este hook apenas mantém a conexão WebSocket aberta
    }

    socket.on('connect', () => {
      console.log('✅ WhatsApp Status WebSocket connected to /whatsapp-status namespace');
      console.log('📡 Socket ID:', socket.id);
      console.log('📡 SessionId in query:', sessionId || 'none (listening to all sessions)');
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ WhatsApp Status WebSocket disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
      console.error('❌ WhatsApp Status WebSocket connection error:', error);
    });
    
    // Log todos os eventos recebidos para debug (mas não processar aqui, deixar o componente fazer isso)
    // Removido para evitar conflito com o onAny do componente
    // O componente WhatsAppSessionManagement tem seu próprio onAny que processa os eventos

    return () => {
      // Usar a variável local 'socket' em vez de socketRef.current
      // porque o ref pode não estar atualizado ainda
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [sessionId, dispatch]);

  return {
    socket: socketRef.current,
  };
};

