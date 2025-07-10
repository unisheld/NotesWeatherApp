import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Note {
  id: string;
  type: 'text' | 'reminder';
  content: string;
  reminderDate?: string;
}

interface NotesState {
  notes: Note[];
  notificationTriggeredId: string | null; 
}

const initialState: NotesState = {
  notes: [],
  notificationTriggeredId: null,
};

const notesSlice = createSlice({
  name: 'notes',
  initialState,
  reducers: {
    addNote: (state, action: PayloadAction<Note>) => {
      state.notes.push(action.payload);
    },
    updateNote: (state, action: PayloadAction<Note>) => {
      const index = state.notes.findIndex(n => n.id === action.payload.id);
      if (index !== -1) state.notes[index] = action.payload;
    },
    deleteNote: (state, action: PayloadAction<string>) => {
      state.notes = state.notes.filter(n => n.id !== action.payload);
    },
    setNotes: (state, action: PayloadAction<Note[]>) => {
      state.notes = action.payload;
    },
    setNotificationTriggeredId: (state, action: PayloadAction<string | null>) => {
      state.notificationTriggeredId = action.payload;
    },
  },
});

export const {
  addNote,
  updateNote,
  deleteNote,
  setNotes,
  setNotificationTriggeredId,
} = notesSlice.actions;

export default notesSlice.reducer;
