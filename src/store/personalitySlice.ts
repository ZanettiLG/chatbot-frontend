import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { personalityService, Personality } from '../services/personalityService';

interface PersonalityState {
  personalities: Personality[];
  loading: boolean;
  error: string | null;
}

const initialState: PersonalityState = {
  personalities: [],
  loading: false,
  error: null,
};

export const fetchPersonalities = createAsyncThunk(
  'personality/fetchPersonalities',
  async (options?: { activeOnly?: boolean; defaultOnly?: boolean }) => {
    return personalityService.getAll(options?.activeOnly, options?.defaultOnly);
  }
);

export const createPersonality = createAsyncThunk(
  'personality/createPersonality',
  async (personalityData: Omit<Personality, 'id' | 'createdAt' | 'updatedAt' | 'isDefault'>) => {
    return personalityService.create(personalityData as any);
  }
);

export const updatePersonality = createAsyncThunk(
  'personality/updatePersonality',
  async ({ id, data }: { id: string; data: Partial<Personality> }) => {
    return personalityService.update(id, data);
  }
);

export const deletePersonality = createAsyncThunk(
  'personality/deletePersonality',
  async (id: string) => {
    await personalityService.delete(id);
    return id;
  }
);

const personalitySlice = createSlice({
  name: 'personality',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPersonalities.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPersonalities.fulfilled, (state, action) => {
        state.loading = false;
        state.personalities = action.payload;
      })
      .addCase(fetchPersonalities.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch personalities';
      })
      .addCase(createPersonality.fulfilled, (state, action) => {
        state.personalities.push(action.payload);
      })
      .addCase(createPersonality.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to create personality';
      })
      .addCase(updatePersonality.fulfilled, (state, action) => {
        const index = state.personalities.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.personalities[index] = action.payload;
        }
      })
      .addCase(updatePersonality.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to update personality';
      })
      .addCase(deletePersonality.fulfilled, (state, action) => {
        state.personalities = state.personalities.filter(p => p.id !== action.payload);
      })
      .addCase(deletePersonality.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to delete personality';
      });
  },
});

export const { clearError } = personalitySlice.actions;
export default personalitySlice.reducer;

