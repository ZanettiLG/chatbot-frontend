import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Message {
  id: string;
  content: string;
  timestamp: Date;
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
      state.messages.push(action.payload);
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
