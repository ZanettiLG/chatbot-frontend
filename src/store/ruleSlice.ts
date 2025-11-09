import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { ruleService, Rule } from '../services/ruleService';

interface RuleState {
  rules: Rule[];
  loading: boolean;
  error: string | null;
}

const initialState: RuleState = {
  rules: [],
  loading: false,
  error: null,
};

export const fetchRules = createAsyncThunk(
  'rule/fetchRules',
  async (options?: { activeOnly?: boolean; defaultOnly?: boolean }) => {
    return ruleService.getAll(options?.activeOnly, options?.defaultOnly);
  }
);

export const createRule = createAsyncThunk(
  'rule/createRule',
  async (ruleData: Omit<Rule, 'id' | 'createdAt' | 'updatedAt' | 'isDefault'>) => {
    return ruleService.create(ruleData as any);
  }
);

export const updateRule = createAsyncThunk(
  'rule/updateRule',
  async ({ id, data }: { id: string; data: Partial<Rule> }) => {
    return ruleService.update(id, data);
  }
);

export const deleteRule = createAsyncThunk(
  'rule/deleteRule',
  async (id: string) => {
    await ruleService.delete(id);
    return id;
  }
);

const ruleSlice = createSlice({
  name: 'rule',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRules.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRules.fulfilled, (state, action) => {
        state.loading = false;
        state.rules = action.payload;
      })
      .addCase(fetchRules.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch rules';
      })
      .addCase(createRule.fulfilled, (state, action) => {
        state.rules.push(action.payload);
      })
      .addCase(createRule.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to create rule';
      })
      .addCase(updateRule.fulfilled, (state, action) => {
        const index = state.rules.findIndex(r => r.id === action.payload.id);
        if (index !== -1) {
          state.rules[index] = action.payload;
        }
      })
      .addCase(updateRule.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to update rule';
      })
      .addCase(deleteRule.fulfilled, (state, action) => {
        state.rules = state.rules.filter(r => r.id !== action.payload);
      })
      .addCase(deleteRule.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to delete rule';
      });
  },
});

export const { clearError } = ruleSlice.actions;
export default ruleSlice.reducer;

