export enum WorldStateEntityType {
  PRODUCT = 'product',
  ADDRESS = 'address',
  QUANTITY = 'quantity',
  ORDER = 'order',
  CUSTOMER_NAME = 'customer_name',
  INTENTION = 'intention',
  SUBJECT_CHANGE = 'subject_change',
  CONFIRMATION = 'confirmation',
  PAYMENT_METHOD = 'payment_method',
  DELIVERY_OPTION = 'delivery_option',
}

export enum WorldStateActionType {
  CHOOSE = 'choose',
  SET = 'set',
  UPDATE = 'update',
  REMOVE = 'remove',
  CONFIRM = 'confirm',
  INCREMENT = 'increment',
  DECREMENT = 'decrement',
  APPEND = 'append',
  MERGE = 'merge',
}

export interface ActionPrerequisite {
  worldStateKey: WorldStateEntityType;
  operator: 'exists' | 'not_exists' | 'equals' | 'not_equals' | 'greater_than' | 'less_than';
  value?: any;
}

export interface ActionEffect {
  worldStateKey: WorldStateEntityType;
  operator: WorldStateActionType;
  value: any;
}

export interface Action {
  id: string;
  name: string;
  description: string;
  category: string;
  prerequisites: ActionPrerequisite[];
  effects: ActionEffect[];
  cost: number;
  toolId?: string;
  roleIds: string[];
  isStateOnly: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GoalCondition {
  worldStateKey: WorldStateEntityType;
  operator: 'exists' | 'not_exists' | 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains';
  value?: any;
}

export interface RoleGoal {
  id: string;
  name: string;
  description: string;
  priority: number;
  category: string;
  activationConditions: GoalCondition[];
  successCriteria: GoalCondition[];
  suggestedActions: string[];
  metadata?: {
    rules?: string[];
    completionStrategy?: 'all_actions' | 'success_criteria' | 'manual';
  };
}

export interface ActiveGoal {
  goalId: string;
  goalName: string;
  status: 'active' | 'in_progress' | 'completed' | 'failed' | 'paused';
  startedAt: string;
  priority: number;
  requiredActions: string[];
  completedActions: string[];
  lastActionAt?: string;
}

export interface PlannedAction {
  actionId: string;
  actionName: string;
  goalId: string;
  prerequisites: ActionPrerequisite[];
  cost: number;
  status: 'planned' | 'ready' | 'executing' | 'completed' | 'failed';
  plannedAt: string;
  executedAt?: string;
}

export interface ConversationState {
  sessionId: string;
  worldState: {
    entities: Record<string, any>;
    metadata: Record<string, any>;
  };
  currentGoals: ActiveGoal[];
  pendingActions: PlannedAction[];
  lastUpdated: string;
}

