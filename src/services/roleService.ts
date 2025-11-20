import config from '../config/env';
import { RoleGoal } from '../types/goap.types';

export interface Role {
  id: string;
  name: string;
  description: string;
  prompt: string;
  category: string;
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;
  goals?: RoleGoal[];
}

export interface CreateRoleData {
  name: string;
  description: string;
  prompt: string;
  category: string;
  metadata?: Record<string, any>;
}

export interface UpdateRoleData {
  name?: string;
  description?: string;
  prompt?: string;
  category?: string;
  isActive?: boolean;
  metadata?: Record<string, any>;
  goals?: RoleGoal[];
}

class RoleService {
  private baseUrl = `${config.apiUrl}/roles`;

  async getAll(activeOnly?: boolean, defaultOnly?: boolean): Promise<Role[]> {
    const params = new URLSearchParams();
    if (activeOnly) params.append('active', 'true');
    if (defaultOnly) params.append('default', 'true');
    const url = params.toString() ? `${this.baseUrl}?${params}` : this.baseUrl;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch roles: ${response.statusText}`);
    }
    return response.json();
  }

  async getById(id: string): Promise<Role> {
    const response = await fetch(`${this.baseUrl}/${id}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch role: ${response.statusText}`);
    }
    return response.json();
  }

  async create(data: CreateRoleData): Promise<Role> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`Failed to create role: ${response.statusText}`);
    }
    return response.json();
  }

  async update(id: string, data: UpdateRoleData): Promise<Role> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`Failed to update role: ${response.statusText}`);
    }
    return response.json();
  }

  async delete(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error(`Failed to delete role: ${response.statusText}`);
    }
  }

  async getTools(roleId: string): Promise<string[]> {
    const response = await fetch(`${this.baseUrl}/${roleId}/tools`);
    if (!response.ok) {
      throw new Error(`Failed to fetch role tools: ${response.statusText}`);
    }
    const tools = await response.json();
    return tools.map((tool: any) => tool.id);
  }
}

export const roleService = new RoleService();

