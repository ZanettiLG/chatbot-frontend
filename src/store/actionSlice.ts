import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Action } from '../types/goap.types';
import { actionService, CreateActionData, UpdateActionData } from '../services/actionService';

interface ActionState {
  actions: Action[];
  loading: boolean;
  error: string | null;
}

const initialState: ActionState = {
  actions: [],
  loading: false,
  error: null,
};

export const fetchActions = createAsyncThunk(
  'action/fetchActions',
  async (roleIds?: string[]) => {
    return actionService.getAll(roleIds);
  }
);

export const createAction = createAsyncThunk(
  'action/createAction',
  async (data: CreateActionData) => {
    return actionService.create(data);
  }
);

export const updateAction = createAsyncThunk(
  'action/updateAction',
  async ({ id, data }: { id: string; data: UpdateActionData }) => {
    return actionService.update(id, data);
  }
);

const actionSlice = createSlice({
  name: 'action',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchActions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchActions.fulfilled, (state, action) => {
        state.loading = false;
        state.actions = action.payload;
      })
      .addCase(fetchActions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch actions';
      })
      .addCase(createAction.fulfilled, (state, action) => {
        state.actions.push(action.payload);
      })
      .addCase(updateAction.fulfilled, (state, action) => {
        const index = state.actions.findIndex(a => a.id === action.payload.id);
        if (index !== -1) {
          state.actions[index] = action.payload;
        }
      });
  },
});

export const { clearError } = actionSlice.actions;
export default actionSlice.reducer;

