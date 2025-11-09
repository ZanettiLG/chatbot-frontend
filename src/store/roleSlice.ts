import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { roleService, Role } from '../services/roleService';

interface RoleState {
  roles: Role[];
  loading: boolean;
  error: string | null;
}

const initialState: RoleState = {
  roles: [],
  loading: false,
  error: null,
};

export const fetchRoles = createAsyncThunk(
  'role/fetchRoles',
  async (options?: { activeOnly?: boolean; defaultOnly?: boolean }) => {
    return roleService.getAll(options?.activeOnly, options?.defaultOnly);
  }
);

export const createRole = createAsyncThunk(
  'role/createRole',
  async (roleData: Omit<Role, 'id' | 'createdAt' | 'updatedAt' | 'isDefault'>) => {
    return roleService.create(roleData as any);
  }
);

export const updateRole = createAsyncThunk(
  'role/updateRole',
  async ({ id, data }: { id: string; data: Partial<Role> }) => {
    return roleService.update(id, data);
  }
);

export const deleteRole = createAsyncThunk(
  'role/deleteRole',
  async (id: string) => {
    await roleService.delete(id);
    return id;
  }
);

const roleSlice = createSlice({
  name: 'role',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRoles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRoles.fulfilled, (state, action) => {
        state.loading = false;
        state.roles = action.payload;
      })
      .addCase(fetchRoles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch roles';
      })
      .addCase(createRole.fulfilled, (state, action) => {
        state.roles.push(action.payload);
      })
      .addCase(createRole.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to create role';
      })
      .addCase(updateRole.fulfilled, (state, action) => {
        const index = state.roles.findIndex(r => r.id === action.payload.id);
        if (index !== -1) {
          state.roles[index] = action.payload;
        }
      })
      .addCase(updateRole.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to update role';
      })
      .addCase(deleteRole.fulfilled, (state, action) => {
        state.roles = state.roles.filter(r => r.id !== action.payload);
      })
      .addCase(deleteRole.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to delete role';
      });
  },
});

export const { clearError } = roleSlice.actions;
export default roleSlice.reducer;

