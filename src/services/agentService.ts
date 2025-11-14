import config from '../config/env';

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

export interface CreateAgentData {
  name: string;
  description: string;
  roleId: string;
  personalityId: string;
  ruleIds: string[];
  language: string;
  style: string;
  systemPrompt?: string;
  knowledgeIds?: string[];
  enableDialecticReasoning?: boolean;
  metadata?: Record<string, any>;
}

export interface UpdateAgentData {
  name?: string;
  description?: string;
  roleId?: string;
  personalityId?: string;
  ruleIds?: string[];
  language?: string;
  style?: string;
  systemPrompt?: string;
  knowledgeIds?: string[];
  isActive?: boolean;
  enableDialecticReasoning?: boolean;
  metadata?: Record<string, any>;
}

class AgentService {
  private baseUrl = `${config.apiUrl}/agents`;

  async getAll(activeOnly?: boolean): Promise<Agent[]> {
    const url = activeOnly ? `${this.baseUrl}?active=true` : this.baseUrl;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch agents: ${response.statusText}`);
    }
    return response.json();
  }

  async getById(id: string): Promise<Agent> {
    const response = await fetch(`${this.baseUrl}/${id}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch agent: ${response.statusText}`);
    }
    return response.json();
  }

  async create(data: CreateAgentData): Promise<Agent> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`Failed to create agent: ${response.statusText}`);
    }
    return response.json();
  }

  async update(id: string, data: UpdateAgentData): Promise<Agent> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`Failed to update agent: ${response.statusText}`);
    }
    return response.json();
  }

  async delete(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error(`Failed to delete agent: ${response.statusText}`);
    }
  }

  async getKnowledgeOwner(documentId: string): Promise<{ agentId: string | null }> {
    const response = await fetch(`${this.baseUrl}/knowledge/${documentId}/owner`);
    if (!response.ok) {
      throw new Error(`Failed to get knowledge owner: ${response.statusText}`);
    }
    return response.json();
  }
}

export const agentService = new AgentService();

