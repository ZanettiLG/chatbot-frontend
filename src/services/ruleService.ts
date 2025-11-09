import config from '../config/env';

export interface Rule {
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
}

export interface CreateRuleData {
  name: string;
  description: string;
  prompt: string;
  category: string;
  metadata?: Record<string, any>;
}

export interface UpdateRuleData {
  name?: string;
  description?: string;
  prompt?: string;
  category?: string;
  isActive?: boolean;
  metadata?: Record<string, any>;
}

class RuleService {
  private baseUrl = `${config.apiUrl}/rules`;

  async getAll(activeOnly?: boolean, defaultOnly?: boolean): Promise<Rule[]> {
    const params = new URLSearchParams();
    if (activeOnly) params.append('active', 'true');
    if (defaultOnly) params.append('default', 'true');
    const url = params.toString() ? `${this.baseUrl}?${params}` : this.baseUrl;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch rules: ${response.statusText}`);
    }
    return response.json();
  }

  async getById(id: string): Promise<Rule> {
    const response = await fetch(`${this.baseUrl}/${id}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch rule: ${response.statusText}`);
    }
    return response.json();
  }

  async create(data: CreateRuleData): Promise<Rule> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`Failed to create rule: ${response.statusText}`);
    }
    return response.json();
  }

  async update(id: string, data: UpdateRuleData): Promise<Rule> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`Failed to update rule: ${response.statusText}`);
    }
    return response.json();
  }

  async delete(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error(`Failed to delete rule: ${response.statusText}`);
    }
  }
}

export const ruleService = new RuleService();

