// Lógica pura de reconexão (isolada e testável)
import { EngineConfig } from '../types';

export interface ReconnectionState {
  attempts: number;
  timer: NodeJS.Timeout | null;
  isManualClose: boolean;
}

export const createReconnectionState = (): ReconnectionState => ({
  attempts: 0,
  timer: null,
  isManualClose: false,
});

export const scheduleReconnect = (
  state: ReconnectionState,
  config: Required<EngineConfig>,
  reconnectFn: () => void
): ReconnectionState => {
  if (state.timer) {
    clearTimeout(state.timer);
  }

  if (state.isManualClose || state.attempts >= config.maxReconnectAttempts) {
    return state;
  }

  const newAttempts = state.attempts + 1;
  console.log(
    `🔄 Tentando reconectar (${newAttempts}/${config.maxReconnectAttempts}) em ${config.reconnectInterval}ms...`
  );

  const timer = setTimeout(() => {
    reconnectFn();
  }, config.reconnectInterval);

  return {
    ...state,
    attempts: newAttempts,
    timer,
  };
};

export const resetReconnection = (state: ReconnectionState): ReconnectionState => {
  if (state.timer) {
    clearTimeout(state.timer);
  }

  return {
    ...state,
    attempts: 0,
    timer: null,
  };
};

export const cancelReconnection = (state: ReconnectionState): ReconnectionState => {
  if (state.timer) {
    clearTimeout(state.timer);
  }

  return {
    ...state,
    isManualClose: true,
    timer: null,
  };
};

