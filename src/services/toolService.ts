import config from '../config/env';

export interface Tool {
  id: string;
  name: string;
  description: string;
  type: 'function' | 'database_action' | 'api_call';
  handler: string;
  parameters: ToolParameter[];
  category: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;
}

export interface ToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  required: boolean;
  enum?: string[];
}

export interface CreateToolData {
  name: string;
  description: string;
  type: 'function' | 'database_action' | 'api_call';
  handler: string;
  parameters: ToolParameter[];
  category: string;
  metadata?: Record<string, any>;
}

export interface UpdateToolData {
  name?: string;
  description?: string;
  type?: 'function' | 'database_action' | 'api_call';
  handler?: string;
  parameters?: ToolParameter[];
  category?: string;
  isActive?: boolean;
  metadata?: Record<string, any>;
}

class ToolService {
  private baseUrl = `${config.apiUrl}/tools`;

  async getAll(activeOnly?: boolean): Promise<Tool[]> {
    const url = activeOnly ? `${this.baseUrl}?activeOnly=true` : this.baseUrl;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch tools');
    }
    return response.json();
  }

  async getById(id: string): Promise<Tool> {
    const response = await fetch(`${this.baseUrl}/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch tool');
    }
    return response.json();
  }

  async create(data: CreateToolData): Promise<Tool> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Failed to create tool');
    }
    return response.json();
  }

  async update(id: string, data: UpdateToolData): Promise<Tool> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Failed to update tool');
    }
    return response.json();
  }

  async delete(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete tool');
    }
  }

  async addToRole(roleId: string, toolId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/roles/${roleId}/tools/${toolId}`, {
      method: 'POST',
    });
    if (!response.ok) {
      throw new Error('Failed to add tool to role');
    }
  }

  async removeFromRole(roleId: string, toolId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/roles/${roleId}/tools/${toolId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to remove tool from role');
    }
  }
}

export const toolService = new ToolService();

