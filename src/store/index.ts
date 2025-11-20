import { configureStore } from '@reduxjs/toolkit';
import chatSlice from './chatSlice';
import engineSlice from './engineSlice';
import uiSlice from './uiSlice';
import agentSlice from './agentSlice';
import roleSlice from './roleSlice';
import personalitySlice from './personalitySlice';
import ruleSlice from './ruleSlice';
import whatsappSessionSlice from './whatsappSessionSlice';
import toolSlice from './toolSlice';
import conversationSlice from './conversationSlice';
import actionSlice from './actionSlice';
import conversationStateSlice from './conversationStateSlice';

export const store = configureStore({
  reducer: {
    chat: chatSlice,
    engine: engineSlice,
    ui: uiSlice,
    agent: agentSlice,
    role: roleSlice,
    personality: personalitySlice,
    rule: ruleSlice,
    whatsappSession: whatsappSessionSlice,
    tool: toolSlice,
    conversation: conversationSlice,
    action: actionSlice,
    conversationState: conversationStateSlice,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
