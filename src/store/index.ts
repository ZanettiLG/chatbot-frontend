import { configureStore } from '@reduxjs/toolkit';
import chatSlice from './chatSlice';
import engineSlice from './engineSlice';
import uiSlice from './uiSlice';
import agentSlice from './agentSlice';
import roleSlice from './roleSlice';
import personalitySlice from './personalitySlice';
import ruleSlice from './ruleSlice';

export const store = configureStore({
  reducer: {
    chat: chatSlice,
    engine: engineSlice,
    ui: uiSlice,
    agent: agentSlice,
    role: roleSlice,
    personality: personalitySlice,
    rule: ruleSlice,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
