import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { agentService } from '../services/agentService';

export interface Agent {
  id: string;
  name: string;
  description: string;
  roleId: string;
  personalityId: string;
  ruleIds: string[];
  language: string;
  style: string;
  systemPrompt?: string;
  knowledgeIds: string[];
  isActive: boolean;
  enableDialecticReasoning: boolean;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;
}

interface AgentState {
  agents: Agent[];
  selectedAgentId: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: AgentState = {
  agents: [],
  selectedAgentId: null,
  loading: false,
  error: null,
};

export const fetchAgents = createAsyncThunk(
  'agent/fetchAgents',
  async (activeOnly?: boolean) => {
    return agentService.getAll(activeOnly);
  }
);

export const createAgent = createAsyncThunk(
  'agent/createAgent',
  async (agentData: Omit<Agent, 'id' | 'createdAt' | 'updatedAt'>) => {
    return agentService.create(agentData as any);
  }
);

export const updateAgent = createAsyncThunk(
  'agent/updateAgent',
  async ({ id, data }: { id: string; data: Partial<Agent> }) => {
    return agentService.update(id, data);
  }
);

export const deleteAgent = createAsyncThunk(
  'agent/deleteAgent',
  async (id: string) => {
    await agentService.delete(id);
    return id;
  }
);

const agentSlice = createSlice({
  name: 'agent',
  initialState,
  reducers: {
    selectAgent: (state, action: PayloadAction<string | null>) => {
      state.selectedAgentId = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch agents
      .addCase(fetchAgents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAgents.fulfilled, (state, action) => {
        state.loading = false;
        state.agents = action.payload;
      })
      .addCase(fetchAgents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch agents';
      })
      // Create agent
      .addCase(createAgent.fulfilled, (state, action) => {
        state.agents.push(action.payload);
      })
      .addCase(createAgent.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to create agent';
      })
      // Update agent
      .addCase(updateAgent.fulfilled, (state, action) => {
        const index = state.agents.findIndex(a => a.id === action.payload.id);
        if (index !== -1) {
          state.agents[index] = action.payload;
        }
      })
      .addCase(updateAgent.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to update agent';
      })
      // Delete agent
      .addCase(deleteAgent.fulfilled, (state, action) => {
        state.agents = state.agents.filter(a => a.id !== action.payload);
        if (state.selectedAgentId === action.payload) {
          state.selectedAgentId = null;
        }
      })
      .addCase(deleteAgent.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to delete agent';
      });
  },
});

export const { selectAgent, clearError } = agentSlice.actions;
export default agentSlice.reducer;

