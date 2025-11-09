import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface EngineStatus {
  websocket: {
    isConnected: boolean;
    isEnabled: boolean;
    messageCount: number;
    lastActivity?: string; // ISO string ao invés de Date
  };
  whatsapp: {
    isConnected: boolean;
    isEnabled: boolean;
    messageCount: number;
    lastActivity?: string; // ISO string ao invés de Date
    qrCode?: string;
    sessionStatus: 'disconnected' | 'connecting' | 'connected' | 'qr_required';
  };
}

interface EngineState {
  engines: EngineStatus;
  selectedEngine: 'websocket' | 'whatsapp' | null;
}

const initialState: EngineState = {
  engines: {
    websocket: {
      isConnected: false,
      isEnabled: true,
      messageCount: 0,
    },
    whatsapp: {
      isConnected: false,
      isEnabled: true,
      messageCount: 0,
      sessionStatus: 'disconnected',
    },
  },
  selectedEngine: null,
};

const engineSlice = createSlice({
  name: 'engine',
  initialState,
  reducers: {
    updateEngineStatus: (state, action: PayloadAction<{ engine: keyof EngineStatus; status: Partial<EngineStatus[keyof EngineStatus]> }>) => {
      const { engine, status } = action.payload;
      // Preservar propriedades específicas de cada engine ao fazer merge
      if (engine === 'whatsapp') {
        // Para WhatsApp, garantir que sessionStatus seja preservado se não fornecido
        const currentState = state.engines.whatsapp;
        const whatsappStatus = status as Partial<EngineStatus['whatsapp']>;
        state.engines.whatsapp = {
          ...currentState,
          ...whatsappStatus,
          sessionStatus: whatsappStatus.sessionStatus ?? currentState.sessionStatus,
        };
      } else {
        // Para WebSocket, apenas fazer merge simples
        const currentState = state.engines.websocket;
        state.engines.websocket = {
          ...currentState,
          ...status,
        };
      }
    },
    setSelectedEngine: (state, action: PayloadAction<'websocket' | 'whatsapp' | null>) => {
      state.selectedEngine = action.payload;
    },
    incrementMessageCount: (state, action: PayloadAction<keyof EngineStatus>) => {
      state.engines[action.payload].messageCount += 1;
      state.engines[action.payload].lastActivity = new Date().toISOString();
    },
  },
});

export const { updateEngineStatus, setSelectedEngine, incrementMessageCount } = engineSlice.actions;
export default engineSlice.reducer;
