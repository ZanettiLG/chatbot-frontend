import config from '../config/env';

export interface Personality {
  id: string;
  name: string;
  description: string;
  prompt: string;
  traits: string[];
  examples: string[];
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;
}

export interface CreatePersonalityData {
  name: string;
  description: string;
  prompt: string;
  traits?: string[];
  examples?: string[];
  metadata?: Record<string, any>;
}

export interface UpdatePersonalityData {
  name?: string;
  description?: string;
  prompt?: string;
  traits?: string[];
  examples?: string[];
  isActive?: boolean;
  metadata?: Record<string, any>;
}

class PersonalityService {
  private baseUrl = `${config.apiUrl}/personalities`;

  async getAll(activeOnly?: boolean, defaultOnly?: boolean): Promise<Personality[]> {
    const params = new URLSearchParams();
    if (activeOnly) params.append('active', 'true');
    if (defaultOnly) params.append('default', 'true');
    const url = params.toString() ? `${this.baseUrl}?${params}` : this.baseUrl;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch personalities: ${response.statusText}`);
    }
    return response.json();
  }

  async getById(id: string): Promise<Personality> {
    const response = await fetch(`${this.baseUrl}/${id}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch personality: ${response.statusText}`);
    }
    return response.json();
  }

  async create(data: CreatePersonalityData): Promise<Personality> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`Failed to create personality: ${response.statusText}`);
    }
    return response.json();
  }

  async update(id: string, data: UpdatePersonalityData): Promise<Personality> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`Failed to update personality: ${response.statusText}`);
    }
    return response.json();
  }

  async delete(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error(`Failed to delete personality: ${response.statusText}`);
    }
  }
}

export const personalityService = new PersonalityService();

