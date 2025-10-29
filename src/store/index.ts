import { configureStore } from '@reduxjs/toolkit';
import chatSlice from './store/chatSlice';
import engineSlice from './store/engineSlice';
import uiSlice from './store/uiSlice';

export const store = configureStore({
  reducer: {
    chat: chatSlice,
    engine: engineSlice,
    ui: uiSlice,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
