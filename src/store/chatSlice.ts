import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Message {
  id: string;
  content: string;
  timestamp: string; // ISO string ao invés de Date
  source: 'websocket' | 'whatsapp' | 'system';
  userId?: string;
  type: 'text' | 'image' | 'audio' | 'video';
}

interface ChatState {
  messages: Message[];
  isConnected: boolean;
  currentEngine: 'websocket' | 'whatsapp' | null;
}

const initialState: ChatState = {
  messages: [],
  isConnected: false,
  currentEngine: null,
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    addMessage: (state, action: PayloadAction<Message>) => {
      // Verificar se a mensagem já existe (evitar duplicatas)
      const exists = state.messages.some(msg => msg.id === action.payload.id);
      if (!exists) {
        state.messages.push(action.payload);
      }
    },
    setConnectionStatus: (state, action: PayloadAction<boolean>) => {
      state.isConnected = action.payload;
    },
    setCurrentEngine: (state, action: PayloadAction<'websocket' | 'whatsapp' | null>) => {
      state.currentEngine = action.payload;
    },
    clearMessages: (state) => {
      state.messages = [];
    },
  },
});

export const { addMessage, setConnectionStatus, setCurrentEngine, clearMessages } = chatSlice.actions;
export default chatSlice.reducer;
