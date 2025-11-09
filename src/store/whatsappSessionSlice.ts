import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { whatsappSessionService, WhatsAppSession, CreateWhatsAppSessionData, UpdateWhatsAppSessionData } from '../services/whatsappSessionService';

interface WhatsAppSessionState {
  sessions: WhatsAppSession[];
  selectedSession: string | null;
  qrCodes: Record<string, string>; // sessionId -> qrCode
  loading: boolean;
  error: string | null;
}

const initialState: WhatsAppSessionState = {
  sessions: [],
  selectedSession: null,
  qrCodes: {},
  loading: false,
  error: null,
};

export const fetchWhatsAppSessions = createAsyncThunk(
  'whatsappSession/fetchSessions',
  async (activeOnly?: boolean) => {
    return whatsappSessionService.getAll(activeOnly);
  }
);

export const fetchWhatsAppSession = createAsyncThunk(
  'whatsappSession/fetchSession',
  async (id: string) => {
    return whatsappSessionService.getById(id);
  }
);

export const createWhatsAppSession = createAsyncThunk(
  'whatsappSession/createSession',
  async (data: CreateWhatsAppSessionData) => {
    return whatsappSessionService.create(data);
  }
);

export const updateWhatsAppSession = createAsyncThunk(
  'whatsappSession/updateSession',
  async ({ id, data }: { id: string; data: UpdateWhatsAppSessionData }) => {
    return whatsappSessionService.update(id, data);
  }
);

export const deleteWhatsAppSession = createAsyncThunk(
  'whatsappSession/deleteSession',
  async (id: string) => {
    await whatsappSessionService.delete(id);
    return id;
  }
);

export const initializeWhatsAppSession = createAsyncThunk(
  'whatsappSession/initializeSession',
  async (id: string) => {
    await whatsappSessionService.initialize(id);
    return id;
  }
);

export const closeWhatsAppSession = createAsyncThunk(
  'whatsappSession/closeSession',
  async (id: string) => {
    await whatsappSessionService.close(id);
    return id;
  }
);

export const fetchWhatsAppSessionStatus = createAsyncThunk(
  'whatsappSession/fetchStatus',
  async (id: string) => {
    return whatsappSessionService.getStatus(id);
  }
);

export const fetchWhatsAppSessionQRCode = createAsyncThunk(
  'whatsappSession/fetchQRCode',
  async (id: string) => {
    const result = await whatsappSessionService.getQRCode(id);
    return { sessionId: id, qrCode: result.qrCode };
  }
);

const whatsappSessionSlice = createSlice({
  name: 'whatsappSession',
  initialState,
  reducers: {
    selectSession: (state, action: PayloadAction<string | null>) => {
      state.selectedSession = action.payload;
    },
    setQRCode: (state, action: PayloadAction<{ sessionId: string; qrCode: string }>) => {
      state.qrCodes[action.payload.sessionId] = action.payload.qrCode;
    },
    clearQRCode: (state, action: PayloadAction<string>) => {
      delete state.qrCodes[action.payload];
    },
    updateSessionStatus: (state, action: PayloadAction<{ sessionId: string; status: string; phoneNumber?: string; error?: string }>) => {
      const session = state.sessions.find(s => s.id === action.payload.sessionId);
      if (session) {
        session.status = action.payload.status as WhatsAppSession['status'];
        if (action.payload.phoneNumber !== undefined) {
          session.phoneNumber = action.payload.phoneNumber;
        }
        if (action.payload.error !== undefined) {
          session.error = action.payload.error;
        }
      }
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch sessions
      .addCase(fetchWhatsAppSessions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWhatsAppSessions.fulfilled, (state, action) => {
        state.loading = false;
        state.sessions = action.payload;
      })
      .addCase(fetchWhatsAppSessions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch WhatsApp sessions';
      })
      // Fetch single session
      .addCase(fetchWhatsAppSession.fulfilled, (state, action) => {
        const index = state.sessions.findIndex(s => s.id === action.payload.id);
        if (index !== -1) {
          state.sessions[index] = action.payload;
        } else {
          state.sessions.push(action.payload);
        }
        if (action.payload.qrCode) {
          state.qrCodes[action.payload.id] = action.payload.qrCode;
        }
      })
      // Create session
      .addCase(createWhatsAppSession.fulfilled, (state, action) => {
        state.sessions.push(action.payload);
      })
      .addCase(createWhatsAppSession.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to create WhatsApp session';
      })
      // Update session
      .addCase(updateWhatsAppSession.fulfilled, (state, action) => {
        const index = state.sessions.findIndex(s => s.id === action.payload.id);
        if (index !== -1) {
          state.sessions[index] = action.payload;
        }
      })
      .addCase(updateWhatsAppSession.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to update WhatsApp session';
      })
      // Delete session
      .addCase(deleteWhatsAppSession.fulfilled, (state, action) => {
        state.sessions = state.sessions.filter(s => s.id !== action.payload);
        delete state.qrCodes[action.payload];
        if (state.selectedSession === action.payload) {
          state.selectedSession = null;
        }
      })
      .addCase(deleteWhatsAppSession.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to delete WhatsApp session';
      })
      // Initialize session
      .addCase(initializeWhatsAppSession.fulfilled, (state, action) => {
        const session = state.sessions.find(s => s.id === action.payload);
        if (session) {
          session.status = 'connecting';
        }
      })
      .addCase(initializeWhatsAppSession.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to initialize WhatsApp session';
      })
      // Close session
      .addCase(closeWhatsAppSession.fulfilled, (state, action) => {
        const session = state.sessions.find(s => s.id === action.payload);
        if (session) {
          session.status = 'disconnected';
          delete state.qrCodes[action.payload];
        }
      })
      .addCase(closeWhatsAppSession.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to close WhatsApp session';
      })
      // Fetch status
      .addCase(fetchWhatsAppSessionStatus.fulfilled, (state, action) => {
        const session = state.sessions.find(s => s.id === action.meta.arg);
        if (session) {
          session.status = action.payload.status as WhatsAppSession['status'];
          if (action.payload.phoneNumber) {
            session.phoneNumber = action.payload.phoneNumber;
          }
          if (action.payload.error) {
            session.error = action.payload.error;
          }
          if (action.payload.qrCode) {
            state.qrCodes[action.meta.arg] = action.payload.qrCode;
            session.qrCode = action.payload.qrCode;
          }
        }
      })
      // Fetch QR Code
      .addCase(fetchWhatsAppSessionQRCode.fulfilled, (state, action) => {
        state.qrCodes[action.payload.sessionId] = action.payload.qrCode;
        const session = state.sessions.find(s => s.id === action.payload.sessionId);
        if (session) {
          session.qrCode = action.payload.qrCode;
        }
      });
  },
});

export const { selectSession, setQRCode, clearQRCode, updateSessionStatus, clearError } = whatsappSessionSlice.actions;
export default whatsappSessionSlice.reducer;

