import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface EngineStatus {
  websocket: {
    isConnected: boolean;
    isEnabled: boolean;
    messageCount: number;
    lastActivity?: Date;
  };
  whatsapp: {
    isConnected: boolean;
    isEnabled: boolean;
    messageCount: number;
    lastActivity?: Date;
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
      state.engines[engine] = { ...state.engines[engine], ...status };
    },
    setSelectedEngine: (state, action: PayloadAction<'websocket' | 'whatsapp' | null>) => {
      state.selectedEngine = action.payload;
    },
    incrementMessageCount: (state, action: PayloadAction<keyof EngineStatus>) => {
      state.engines[action.payload].messageCount += 1;
      state.engines[action.payload].lastActivity = new Date();
    },
  },
});

export const { updateEngineStatus, setSelectedEngine, incrementMessageCount } = engineSlice.actions;
export default engineSlice.reducer;
