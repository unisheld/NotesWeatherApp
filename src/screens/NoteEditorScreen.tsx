import React, { useState } from 'react';
import { View, TextInput, Button, Switch, Text, Platform } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../redux/store';
import { addNote, updateNote, Note } from '../redux/notesSlice';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import uuid from 'react-native-uuid';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { scheduleNotification, cancelNotification } from '../services/notificationService';

type Props = NativeStackScreenProps<RootStackParamList, 'NoteEditor'>;

export default function NoteEditorScreen({ route, navigation }: Props) {
  const { noteId } = route.params || {};
  const dispatch = useDispatch<AppDispatch>();
  const note = useSelector((state: RootState) =>
    state.notes.notes.find(n => n.id === noteId)
  );

  const [content, setContent] = useState(note?.content ?? '');
  const [isReminder, setIsReminder] = useState(note?.type === 'reminder');
  const [reminderDate, setReminderDate] = useState<Date>(
    note?.reminderDate ? new Date(note.reminderDate) : new Date()
  );
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

  const saveNote = () => {
    const id = noteId ?? uuid.v4().toString();

    const newNote: Note = {
      id,
      content,
      type: isReminder ? 'reminder' : 'text',
      reminderDate: isReminder ? reminderDate.toISOString() : undefined,
    };

    if (noteId) {
      cancelNotification(id);
      dispatch(updateNote(newNote));
    } else {
      dispatch(addNote(newNote));
    }

    if (isReminder && newNote.reminderDate) {
      const localDate = new Date(newNote.reminderDate);
      if (localDate > new Date()) {
        scheduleNotification(newNote.id, newNote.content || 'Reminder', localDate);
      }
    }

    navigation.goBack();
  };

  return (
    <SafeAreaView style={{ flex: 1, padding: 16 }}>
      <TextInput
        placeholder="Note content"
        value={content}
        onChangeText={setContent}
        multiline
        style={{
          borderWidth: 1,
          borderColor: '#ccc',
          padding: 8,
          minHeight: 100,
          borderRadius: 8,
          fontSize: 16,
        }}
      />
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16 }}>
        <Text style={{ fontSize: 16, marginRight: 8 }}>Reminder Note</Text>
        <Switch value={isReminder} onValueChange={setIsReminder} />
      </View>
      {isReminder && (
        <View style={{ marginTop: 16 }}>
          <Button title="Select reminder date/time" onPress={() => setDatePickerVisibility(true)} />
          <Text style={{ marginTop: 8, fontSize: 16 }}>{reminderDate.toLocaleString()}</Text>
          <DateTimePickerModal
            isVisible={isDatePickerVisible}
            mode="datetime"
            onConfirm={(date: Date) => {
              setReminderDate(date);
              setDatePickerVisibility(false);
            }}
            onCancel={() => setDatePickerVisibility(false)}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          />
        </View>
      )}
      <View style={{ marginTop: 24 }}>
        <Button title="Save" onPress={saveNote} />
      </View>
    </SafeAreaView>
  );
}
