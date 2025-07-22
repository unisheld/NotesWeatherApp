import { configureStore } from '@reduxjs/toolkit';
import notesReducer from './notesSlice';
import weatherReducer from './weatherSlice';
import themeReducer from './themeSlice';
import authReducer from './authSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    notes: notesReducer,
    weather: weatherReducer,
    theme: themeReducer,
  },
});


export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
