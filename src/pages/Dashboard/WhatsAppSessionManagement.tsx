/**
 * @deprecated Este componente foi substituído por WhatsAppManagement.tsx
 * A funcionalidade foi movida para /dashboard/whatsapp
 * Este arquivo é mantido apenas para referência e pode ser removido no futuro
 */
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Select from '@mui/material/Select';
import Switch from '@mui/material/Switch';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import AddIcon from '@mui/icons-material/Add';
import ListItem from '@mui/material/ListItem';
import EditIcon from '@mui/icons-material/Edit';
import StopIcon from '@mui/icons-material/Stop';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import DialogTitle from '@mui/material/DialogTitle';
import DeleteIcon from '@mui/icons-material/Delete';
import QrCodeIcon from '@mui/icons-material/QrCode';
import PlayIcon from '@mui/icons-material/PlayArrow';
import RefreshIcon from '@mui/icons-material/Refresh';
import ListItemText from '@mui/material/ListItemText';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import CircularProgress from '@mui/material/CircularProgress';
import FormControlLabel from '@mui/material/FormControlLabel';
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction';

import { RootState } from '../../store';
import { fetchAgents } from '../../store/agentSlice';
import QRCodeDisplay from '../../components/QRCodeDisplay';
import { useWhatsAppStatus } from '../../hooks/useWhatsAppStatus';
import { WhatsAppSession } from '../../services/whatsappSessionService';
import {
  setQRCode,
  clearError,
  clearQRCode,
  updateSessionStatus,
  closeWhatsAppSession,
  fetchWhatsAppSessions,
  createWhatsAppSession,
  updateWhatsAppSession,
  deleteWhatsAppSession,
  initializeWhatsAppSession,
  cancelWhatsAppSessionInitialization,
} from '../../store/whatsappSessionSlice';

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

  // Log quando o socket estiver disponível
  useEffect(() => {
    if (socket) {
      console.log('✅ WhatsAppSessionManagement: Socket available, ID:', socket.id, 'connected:', socket.connected);
    } else {
      console.warn('⚠️ WhatsAppSessionManagement: Socket not available yet');
    }
  }, [socket]);

  // Registrar listeners para cada sessão quando elas mudarem
  useEffect(() => {
    if (!socket) {
      console.warn('⚠️ WhatsAppSessionManagement: Cannot register listeners, socket not available');
      return;
    }
    
    // Função para registrar todos os listeners
    const registerAllListeners = () => {
      console.log('📡 Registering all listeners, socket connected:', socket.connected, 'socket ID:', socket.id);

    const handlers: Array<() => void> = [];

    // Criar um mapa de sessionIds para facilitar o matching
    const sessionIdMap = new Map<string, string>();
    sessions.forEach((session) => {
      // Mapear tanto o ID do banco quanto possíveis variações (com/sem prefixo whatsapp_)
      sessionIdMap.set(session.id, session.id);
      // Se o sessionId do evento tiver prefixo whatsapp_, também mapear
      if (!session.id.startsWith('whatsapp_')) {
        sessionIdMap.set(`whatsapp_${session.id}`, session.id);
      }
    });

    // Handler genérico para QR Code que verifica todos os sessionIds possíveis
    const qrHandler = (data: { sessionId: string; qrCode: string }) => {
      console.log('📱 QR Code event received:', data.sessionId, 'qrCode type:', typeof data.qrCode, 'qrCode length:', data.qrCode?.length);
      console.log('📱 Available sessions:', sessions.map(s => s.id));
      
      // Validar dados recebidos
      if (!data || !data.sessionId || !data.qrCode) {
        console.error('❌ Invalid QR code data received:', data);
        return;
      }
      
      // Tentar encontrar a sessão correspondente
      let matchedSessionId: string | undefined = sessionIdMap.get(data.sessionId);
      
      // Se não encontrou, tentar remover prefixo whatsapp_
      if (!matchedSessionId && data.sessionId.startsWith('whatsapp_')) {
        const withoutPrefix = data.sessionId.replace(/^whatsapp_/, '');
        matchedSessionId = sessionIdMap.get(withoutPrefix);
        console.log('🔍 Tried without prefix:', withoutPrefix, 'found:', !!matchedSessionId);
      }
      
      // Se ainda não encontrou, tentar adicionar prefixo whatsapp_
      if (!matchedSessionId) {
        const withPrefix = `whatsapp_${data.sessionId}`;
        matchedSessionId = sessionIdMap.get(withPrefix);
        console.log('🔍 Tried with prefix:', withPrefix, 'found:', !!matchedSessionId);
      }
      
      // Se ainda não encontrou, usar o sessionId recebido diretamente
      if (!matchedSessionId) {
        // Tentar encontrar na lista de sessões
        const foundSession = sessions.find(s => 
          s.id === data.sessionId || 
          s.id === `whatsapp_${data.sessionId}` || 
          `whatsapp_${s.id}` === data.sessionId
        );
        if (foundSession) {
          matchedSessionId = foundSession.id;
          console.log('✅ Found session by direct match:', foundSession.id);
        } else {
          matchedSessionId = data.sessionId;
          console.log('⚠️ Session not found, using received sessionId:', data.sessionId);
        }
      }
      
      // Sempre salvar o QR code com ambos os IDs (recebido e encontrado) para garantir que seja encontrado
      const finalSessionId = matchedSessionId || data.sessionId;
      console.log('💾 Saving QR code to Redux for session:', finalSessionId);
      dispatch(setQRCode({ sessionId: finalSessionId, qrCode: data.qrCode }));
      
      // Também salvar com o sessionId original (caso seja diferente)
      if (finalSessionId !== data.sessionId) {
        console.log('📝 Also saving QR code with original sessionId:', data.sessionId);
        dispatch(setQRCode({ sessionId: data.sessionId, qrCode: data.qrCode }));
      }
      
      // Abrir dialog automaticamente quando QR code chegar
      console.log('🎯 Opening QR code dialog automatically for session:', finalSessionId);
      setSelectedSessionForQR(finalSessionId);
      setQrDialogOpen(true);
    };

    // Handler genérico para Status que verifica todos os sessionIds possíveis
    const statusHandler = (data: { sessionId: string; status: string; phoneNumber?: string; error?: string }) => {
      console.log('📊 Status event received:', data.sessionId, 'status:', data.status);
      
      // Tentar encontrar a sessão correspondente
      let matchedSessionId: string | undefined = sessionIdMap.get(data.sessionId);
      
      // Se não encontrou, tentar remover prefixo whatsapp_
      if (!matchedSessionId && data.sessionId.startsWith('whatsapp_')) {
        const withoutPrefix = data.sessionId.replace(/^whatsapp_/, '');
        matchedSessionId = sessionIdMap.get(withoutPrefix);
      }
      
      // Se ainda não encontrou, tentar adicionar prefixo whatsapp_
      if (!matchedSessionId) {
        const withPrefix = `whatsapp_${data.sessionId}`;
        matchedSessionId = sessionIdMap.get(withPrefix);
      }
      
      // Se encontrou correspondência, atualizar o status usando o ID do banco
      if (matchedSessionId) {
        console.log('✅ Status matched to session:', matchedSessionId);
        dispatch(updateSessionStatus({
          sessionId: matchedSessionId,
          status: data.status,
          phoneNumber: data.phoneNumber,
          error: data.error,
        }));

        if (data.status === 'connected') {
          dispatch(clearQRCode(matchedSessionId));
        }
      } else {
        console.warn('⚠️ Status event received for unknown session:', data.sessionId);
        // Mesmo assim, tentar usar o sessionId recebido
        dispatch(updateSessionStatus({
          sessionId: data.sessionId,
          status: data.status,
          phoneNumber: data.phoneNumber,
          error: data.error,
        }));
      }
    };

    // Para cada sessão, escutar eventos específicos
    sessions.forEach((session) => {
      console.log(`📡 Registering listeners for session: ${session.id}`);
      socket.on(`session:${session.id}:qr`, qrHandler);
      socket.on(`session:${session.id}:status`, statusHandler);
      
      // Também escutar com prefixo whatsapp_ caso o backend use
      socket.on(`session:whatsapp_${session.id}:qr`, qrHandler);
      socket.on(`session:whatsapp_${session.id}:status`, statusHandler);

      handlers.push(() => {
        socket.off(`session:${session.id}:qr`, qrHandler);
        socket.off(`session:${session.id}:status`, statusHandler);
        socket.off(`session:whatsapp_${session.id}:qr`, qrHandler);
        socket.off(`session:whatsapp_${session.id}:status`, statusHandler);
      });
    });
    
    console.log(`📡 Registered listeners for ${sessions.length} sessions`);
    
    // Adicionar um listener genérico usando onAny() para capturar TODOS os eventos
    // Isso garante que eventos de QR code sejam capturados mesmo se os listeners específicos
    // não estiverem registrados ainda ou se o nome do evento não corresponder exatamente
    const onAnyHandler = (eventName: string, ...args: unknown[]) => {
      console.log('🔍 Socket.IO event received via onAny:', eventName, 'args length:', args.length);
      console.log('🔍 Args details:', args.map((arg, idx) => ({ index: idx, type: typeof arg, isObject: typeof arg === 'object', keys: typeof arg === 'object' ? Object.keys(arg) : 'N/A' })));
      
      // Verificar se é um evento de QR code
      if (eventName.includes(':qr')) {
        console.log('🔍 Event name contains :qr, processing...');
        
        // O Socket.IO pode passar os dados de diferentes formas
        // Tentar args[0] primeiro (formato mais comum)
        let data = args[0];
        
        // Se args[0] não for um objeto, tentar args[1] ou procurar no array
        if (!data || typeof data !== 'object') {
          console.log('⚠️ args[0] is not an object, trying other args...');
          for (let i = 0; i < args.length; i++) {
            if (args[i] && typeof args[i] === 'object' && args[i].sessionId && args[i].qrCode) {
              data = args[i];
              console.log(`✅ Found QR code data in args[${i}]`);
              break;
            }
          }
        }
        
        if (data && typeof data === 'object') {
          console.log('🔍 Data object keys:', Object.keys(data));
          console.log('🔍 Data values:', { sessionId: data.sessionId, hasQrCode: !!data.qrCode, qrCodeType: typeof data.qrCode, qrCodeLength: data.qrCode?.length });
          
          if (data.sessionId && data.qrCode) {
            console.log('✅ QR Code event validated, calling qrHandler');
            qrHandler(data);
          } else {
            console.warn('⚠️ Event has :qr but missing sessionId or qrCode. sessionId:', !!data.sessionId, 'qrCode:', !!data.qrCode);
            console.warn('⚠️ Full data object:', JSON.stringify(data, null, 2));
          }
        } else {
          console.warn('⚠️ Event has :qr but could not find valid data object in args');
          console.warn('⚠️ All args:', args);
        }
      }
      
      // Verificar se é um evento de status
      if (eventName.includes(':status')) {
        const data = args[0];
        if (data && typeof data === 'object' && data.sessionId) {
          console.log('📊 Status event caught by onAny:', eventName, 'sessionId:', data.sessionId);
          statusHandler(data);
        }
      }
    };
    
      console.log('📡 Registering onAny listener...');
      socket.onAny(onAnyHandler);
      
      handlers.push(() => {
        socket.offAny();
      });

      return () => {
        handlers.forEach(cleanup => cleanup());
      };
    };
    
    // Se já está conectado, registrar imediatamente
    if (socket.connected) {
      registerAllListeners();
      return () => {
        // Cleanup será feito pelo registerAllListeners
      };
    } else {
      // Aguardar conexão e então registrar
      console.warn('⚠️ WhatsAppSessionManagement: Socket not connected yet, waiting...');
      const connectHandler = () => {
        console.log('✅ WhatsAppSessionManagement: Socket connected, registering listeners...');
        registerAllListeners();
      };
      socket.on('connect', connectHandler);
      
      // Também tentar registrar após um pequeno delay (caso o evento 'connect' já tenha sido emitido)
      const timeoutId = setTimeout(() => {
        if (socket.connected) {
          console.log('✅ Socket connected (timeout check), registering listeners...');
          registerAllListeners();
        }
      }, 1000);
      
      return () => {
        socket.off('connect', connectHandler);
        clearTimeout(timeoutId);
      };
    }
  }, [socket, sessions, dispatch]);

  useEffect(() => {
    dispatch(fetchWhatsAppSessions());
    dispatch(fetchAgents(true));
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
        }));
      } else {
        await dispatch(createWhatsAppSession({
          name: formData.name,
          agentId: formData.agentId,
          sessionName: formData.sessionName || undefined,
        }));
      }
      handleCloseDialog();
      dispatch(fetchWhatsAppSessions());
    } catch (error) {
      console.error('Error saving session:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta sessão?')) {
      try {
        await dispatch(deleteWhatsAppSession(id));
        dispatch(fetchWhatsAppSessions());
      } catch (error) {
        console.error('Error deleting session:', error);
      }
    }
  };

  const handleInitialize = async (id: string) => {
    try {
      await dispatch(initializeWhatsAppSession(id));
      setSelectedSessionForQR(id);
      setQrDialogOpen(true);
    } catch (error) {
      console.error('Error initializing session:', error);
      alert('Erro ao inicializar sessão. Verifique se o agente está ativo.');
    }
  };

  const handleClose = async (id: string) => {
    try {
      await dispatch(closeWhatsAppSession(id));
      dispatch(fetchWhatsAppSessions());
    } catch (error) {
      console.error('Error closing session:', error);
    }
  };

  const handleShowQR = async (id: string) => {
    const session = sessions.find(s => s.id === id);
    
    // Se a sessão não está conectada e não está em processo de inicialização,
    // inicializar automaticamente antes de mostrar o QR code
    if (session && session.status !== 'connected' && session.status !== 'connecting' && session.status !== 'qr_required') {
      console.log('🔄 Session not initialized, initializing before showing QR code...');
      try {
        await dispatch(initializeWhatsAppSession(id));
      } catch (error) {
        console.error('Error initializing session:', error);
        alert('Erro ao inicializar sessão. Verifique se o agente está ativo.');
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
  
  // Buscar QR code usando o selectedSessionForQR ou tentar variações (com/sem prefixo whatsapp_)
  // Também buscar em todas as chaves do qrCodes para encontrar correspondências
  const selectedSessionQR = selectedSessionForQR ? (() => {
    // Tentar busca direta
    if (qrCodes[selectedSessionForQR]) {
      return qrCodes[selectedSessionForQR];
    }
    
    // Tentar variações com/sem prefixo whatsapp_
    const withoutPrefix = selectedSessionForQR.startsWith('whatsapp_') 
      ? selectedSessionForQR.replace(/^whatsapp_/, '') 
      : null;
    const withPrefix = !selectedSessionForQR.startsWith('whatsapp_') 
      ? `whatsapp_${selectedSessionForQR}` 
      : null;
    
    if (withoutPrefix && qrCodes[withoutPrefix]) {
      console.log('✅ Found QR code without prefix:', withoutPrefix);
      return qrCodes[withoutPrefix];
    }
    
    if (withPrefix && qrCodes[withPrefix]) {
      console.log('✅ Found QR code with prefix:', withPrefix);
      return qrCodes[withPrefix];
    }
    
    // Buscar em todas as chaves para encontrar correspondências parciais
    for (const key in qrCodes) {
      if (key === selectedSessionForQR || 
          key === withoutPrefix || 
          key === withPrefix ||
          key.includes(selectedSessionForQR) || 
          selectedSessionForQR.includes(key)) {
        console.log('✅ Found QR code by partial match:', key);
        return qrCodes[key];
      }
    }
    
    // Log para debug
    console.log('⚠️ QR code not found for session:', selectedSessionForQR, 'available keys:', Object.keys(qrCodes));
    return null;
  })() : null;

  // Monitorar mudanças no QR code e atualizar automaticamente
  useEffect(() => {
    // Verificar se há QR code disponível para alguma sessão
    for (const sessionId in qrCodes) {
      const session = sessions.find(s => 
        s.id === sessionId || 
        s.id === `whatsapp_${sessionId}` || 
        `whatsapp_${s.id}` === sessionId
      );
      
      // Se a sessão tem erro ou está aguardando QR code, abrir dialog automaticamente
      if (session && (session.error || session.status === 'qr_required' || session.status === 'connecting')) {
        const sessionIdToUse = session.id;
        if (!qrDialogOpen || selectedSessionForQR !== sessionIdToUse) {
          console.log('🎯 Auto-opening QR code dialog for session:', sessionIdToUse, 'status:', session.status, 'error:', session.error, 'qrCode available:', !!qrCodes[sessionId]);
          setSelectedSessionForQR(sessionIdToUse);
          setQrDialogOpen(true);
          break; // Abrir apenas para a primeira sessão encontrada
        }
      }
    }
  }, [qrCodes, sessions, qrDialogOpen, selectedSessionForQR]);
  
  // Forçar atualização quando QR code chegar para a sessão selecionada
  useEffect(() => {
    if (selectedSessionForQR && qrCodes[selectedSessionForQR]) {
      console.log('✅ QR code available for selected session:', selectedSessionForQR);
      // Forçar re-render do componente
    }
  }, [qrCodes, selectedSessionForQR]);

  // Fechar modal automaticamente quando a sessão estiver conectada
  useEffect(() => {
    if (selectedSession && selectedSession.status === 'connected' && qrDialogOpen) {
      console.log('✅ Sessão conectada, fechando modal de QR Code');
      const sessionIdToClear = selectedSessionForQR;
      setQrDialogOpen(false);
      setSelectedSessionForQR(null);
      // Limpar QR code do Redux quando fechar
      if (sessionIdToClear) {
        dispatch(clearQRCode(sessionIdToClear));
      }
    }
  }, [selectedSession?.status, qrDialogOpen, selectedSessionForQR, dispatch]);

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
              const hasError = !!session.error;
              const hasQR = qrCodes[session.id] || session.qrCode;
              
              // Determinar qual botão principal mostrar baseado no estado
              // Unificamos Play/QR Code em um único botão que muda de ação
              const getMainActionButton = () => {
                if (isConnected) {
                  // Se conectado, mostrar botão de parar
                  return (
                    <IconButton
                      edge="end"
                      color="error"
                      onClick={() => handleClose(session.id)}
                      title="Desconectar WhatsApp - Encerra a conexão com o WhatsApp"
                    >
                      <StopIcon />
                    </IconButton>
                  );
                } else if (isConnecting && hasQR) {
                  // Se está conectando e tem QR code, mostrar botão de QR code
                  return (
                    <IconButton
                      edge="end"
                      color="primary"
                      onClick={() => handleShowQR(session.id)}
                      title="Ver QR Code - Escaneie com seu WhatsApp para conectar"
                    >
                      <QrCodeIcon />
                    </IconButton>
                  );
                } else if (isConnecting && !hasQR) {
                  // Se está conectando mas não tem QR code ainda, mostrar botão de loading
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
                  // Se tem erro, mostrar botão de reiniciar
                  return (
                    <IconButton
                      edge="end"
                      color="warning"
                      onClick={() => handleInitialize(session.id)}
                      title="Reconectar - Tenta conectar novamente e gerar novo QR Code"
                    >
                      <RefreshIcon />
                    </IconButton>
                  );
                } else {
                  // Se desconectado, mostrar botão de conectar
                  return (
                    <IconButton
                      edge="end"
                      color="primary"
                      onClick={() => handleInitialize(session.id)}
                      title="Conectar WhatsApp - Inicia a conexão e mostra QR Code para escanear"
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
                            color={getStatusColor(session.status)}
                            size="small"
                          />
                          {/* Removido chip "Ativa/Inativa" - redundante, o status já indica isso */}
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
                        {/* Botão principal unificado (Play/QR Code/Stop) */}
                        {getMainActionButton()}
                        
                        {/* Botões secundários sempre visíveis */}
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
          onClose={async () => {
            // Se a sessão está sendo inicializada, cancelar a inicialização
            if (selectedSessionForQR && selectedSession && 
                (selectedSession.status === 'connecting' || selectedSession.status === 'qr_required')) {
              try {
                await dispatch(cancelWhatsAppSessionInitialization(selectedSessionForQR));
                console.log('✅ Initialization canceled for session:', selectedSessionForQR);
              } catch (error) {
                console.error('❌ Error canceling initialization:', error);
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

export default WhatsAppSessionManagement;

