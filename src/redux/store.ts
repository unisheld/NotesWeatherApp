import { configureStore } from '@reduxjs/toolkit';
import notesReducer from './notesSlice';
import weatherReducer from './weatherSlice';
import themeReducer from './themeSlice';

export const store = configureStore({
  reducer: {
    notes: notesReducer,
    weather: weatherReducer,
    theme: themeReducer,
  },
});


export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
