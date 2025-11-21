import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { conversationService, Conversation } from '../services/conversationService';

interface ConversationState {
  conversations: Conversation[];
  selectedConversationId: string | null;
  messagesByConversation: Record<string, any[]>;
  loading: boolean;
  isInitialLoad: boolean;
  error: string | null;
}

const initialState: ConversationState = {
  conversations: [],
  selectedConversationId: null,
  messagesByConversation: {},
  loading: false,
  isInitialLoad: true,
  error: null,
};

export const fetchConversations = createAsyncThunk(
  'conversation/fetchConversations',
  async (filters?: { provider?: string; status?: string; agentId?: string }) => {
    return conversationService.getAll(filters);
  }
);

export const selectConversation = createAsyncThunk(
  'conversation/selectConversation',
  async (id: string) => {
    const conversation = await conversationService.getById(id);
    return { conversation };
  }
);

export const fetchConversationMessages = createAsyncThunk(
  'conversation/fetchMessages',
  async ({ conversationId, limit }: { conversationId: string; limit?: number }) => {
    const messages = await conversationService.getMessages(conversationId, limit);
    return { conversationId, messages };
  }
);

export const sendMessageToConversation = createAsyncThunk(
  'conversation/sendMessage',
  async ({ conversationId, message }: { conversationId: string; message: string }) => {
    await conversationService.sendMessage(conversationId, message);
    return { conversationId, message };
  }
);

export const archiveConversation = createAsyncThunk(
  'conversation/archive',
  async (id: string) => {
    await conversationService.archive(id);
    return id;
  }
);

const conversationSlice = createSlice({
  name: 'conversation',
  initialState,
  reducers: {
    setSelectedConversation: (state, action: PayloadAction<string | null>) => {
      state.selectedConversationId = action.payload;
    },
    addMessage: (state, action: PayloadAction<{ conversationId: string; message: any }>) => {
      const { conversationId, message } = action.payload;
      if (!state.messagesByConversation[conversationId]) {
        state.messagesByConversation[conversationId] = [];
      }
      state.messagesByConversation[conversationId].push(message);
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchConversations.pending, (state) => {
        // Só mostrar loading na primeira carga
        if (state.isInitialLoad) {
          state.loading = true;
        }
        state.error = null;
      })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.loading = false;
        state.isInitialLoad = false;
        // Atualizar conversas sem causar re-render completo
        state.conversations = action.payload;
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.loading = false;
        state.isInitialLoad = false;
        state.error = action.error.message || 'Failed to fetch conversations';
      })
      .addCase(selectConversation.fulfilled, (state, action) => {
        state.selectedConversationId = action.payload.conversation.id;
      })
      .addCase(fetchConversationMessages.fulfilled, (state, action) => {
        state.messagesByConversation[action.payload.conversationId] = action.payload.messages;
      })
      .addCase(archiveConversation.fulfilled, (state, action) => {
        const conversation = state.conversations.find(c => c.id === action.payload);
        if (conversation) {
          conversation.status = 'archived';
        }
      });
  },
});

export const { setSelectedConversation, addMessage, clearError } = conversationSlice.actions;
export default conversationSlice.reducer;

