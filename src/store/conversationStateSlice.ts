import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { ConversationState } from '../types/goap.types';
import { conversationStateService } from '../services/conversationStateService';

interface ConversationStateState {
  currentState: ConversationState | null;
  loading: boolean;
  error: string | null;
}

const initialState: ConversationStateState = {
  currentState: null,
  loading: false,
  error: null,
};

export const fetchConversationState = createAsyncThunk(
  'conversationState/fetchConversationState',
  async (sessionId: string) => {
    const state = await conversationStateService.getBySessionId(sessionId);
    return state;
  }
);

const conversationStateSlice = createSlice({
  name: 'conversationState',
  initialState,
  reducers: {
    clearState: (state) => {
      state.currentState = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchConversationState.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchConversationState.fulfilled, (state, action) => {
        state.loading = false;
        state.currentState = action.payload;
      })
      .addCase(fetchConversationState.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch conversation state';
      });
  },
});

export const { clearState, clearError } = conversationStateSlice.actions;
export default conversationStateSlice.reducer;

