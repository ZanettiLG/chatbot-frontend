import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { toolService, Tool, CreateToolData, UpdateToolData } from '../services/toolService';

interface ToolState {
  tools: Tool[];
  loading: boolean;
  error: string | null;
}

const initialState: ToolState = {
  tools: [],
  loading: false,
  error: null,
};

export const fetchTools = createAsyncThunk(
  'tool/fetchTools',
  async (activeOnly?: boolean) => {
    return toolService.getAll(activeOnly);
  }
);

export const createTool = createAsyncThunk(
  'tool/createTool',
  async (toolData: CreateToolData) => {
    return toolService.create(toolData);
  }
);

export const updateTool = createAsyncThunk(
  'tool/updateTool',
  async ({ id, data }: { id: string; data: UpdateToolData }) => {
    return toolService.update(id, data);
  }
);

export const deleteTool = createAsyncThunk(
  'tool/deleteTool',
  async (id: string) => {
    await toolService.delete(id);
    return id;
  }
);

export const addToolToRole = createAsyncThunk(
  'tool/addToolToRole',
  async ({ roleId, toolId }: { roleId: string; toolId: string }) => {
    await toolService.addToRole(roleId, toolId);
    return { roleId, toolId };
  }
);

export const removeToolFromRole = createAsyncThunk(
  'tool/removeToolFromRole',
  async ({ roleId, toolId }: { roleId: string; toolId: string }) => {
    await toolService.removeFromRole(roleId, toolId);
    return { roleId, toolId };
  }
);

const toolSlice = createSlice({
  name: 'tool',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch tools
      .addCase(fetchTools.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTools.fulfilled, (state, action) => {
        state.loading = false;
        state.tools = action.payload;
      })
      .addCase(fetchTools.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch tools';
      })
      // Create tool
      .addCase(createTool.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createTool.fulfilled, (state, action) => {
        state.loading = false;
        state.tools.push(action.payload);
      })
      .addCase(createTool.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to create tool';
      })
      // Update tool
      .addCase(updateTool.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateTool.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.tools.findIndex((t) => t.id === action.payload.id);
        if (index !== -1) {
          state.tools[index] = action.payload;
        }
      })
      .addCase(updateTool.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update tool';
      })
      // Delete tool
      .addCase(deleteTool.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteTool.fulfilled, (state, action) => {
        state.loading = false;
        state.tools = state.tools.filter((t) => t.id !== action.payload);
      })
      .addCase(deleteTool.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to delete tool';
      });
  },
});

export const { clearError } = toolSlice.actions;
export default toolSlice.reducer;

