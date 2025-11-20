import config from '../config/env';
import { Action, ActionPrerequisite, ActionEffect } from '../types/goap.types';

export interface CreateActionData {
  name: string;
  description: string;
  category: string;
  prerequisites: ActionPrerequisite[];
  effects: ActionEffect[];
  cost: number;
  roleIds: string[];
  isStateOnly?: boolean;
  toolId?: string;
}

export interface UpdateActionData {
  name?: string;
  description?: string;
  category?: string;
  prerequisites?: ActionPrerequisite[];
  effects?: ActionEffect[];
  cost?: number;
  roleIds?: string[];
  isStateOnly?: boolean;
  toolId?: string;
  isActive?: boolean;
}

class ActionService {
  private baseUrl = `${config.apiUrl}/actions`;

  async getAll(roleIds?: string[]): Promise<Action[]> {
    const url = roleIds && roleIds.length > 0
      ? `${this.baseUrl}?roleIds=${roleIds.join(',')}`
      : this.baseUrl;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch actions');
    }
    return response.json();
  }

  async getById(id: string): Promise<Action> {
    const response = await fetch(`${this.baseUrl}/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch action');
    }
    return response.json();
  }

  async create(data: CreateActionData): Promise<Action> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create action');
    }
    return response.json();
  }

  async update(id: string, data: UpdateActionData): Promise<Action> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update action');
    }
    return response.json();
  }
}

export const actionService = new ActionService();

