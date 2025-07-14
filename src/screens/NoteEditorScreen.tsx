import React, { useState } from 'react';
import {
  View,
  TextInput,
  Switch,
  Text,
  Platform,
  StyleSheet,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import uuid from 'react-native-uuid';

import { RootState, AppDispatch } from '../redux/store';
import { addNote, updateNote, Note } from '../redux/notesSlice';
import { scheduleNotification, cancelNotification } from '../services/notificationService';

import AnimatedButton from '../components/AnimatedButton';
import { useTheme } from '../theme/useTheme';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'NoteEditor'>;

export default function NoteEditorScreen({ route, navigation }: Props) {
  const { noteId } = route.params || {};
  const dispatch = useDispatch<AppDispatch>();

  const note = useSelector((state: RootState) =>
    state.notes.notes.find(n => n.id === noteId)
  );

  const theme = useTheme();
  const styles = createStyles(theme);

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
    <SafeAreaView style={styles.container}>
      <TextInput
        placeholder="Note content"
        placeholderTextColor={theme.text + '99'}
        value={content}
        onChangeText={setContent}
        multiline
        style={styles.input}
      />

      <View style={styles.row}>
        <Text style={styles.label}>Reminder Note</Text>
        <Switch
          value={isReminder}
          onValueChange={setIsReminder}
          trackColor={{ true: theme.primary, false: '#ccc' }}
          thumbColor={isReminder ? theme.primary : '#f4f3f4'}
        />
      </View>

      {isReminder && (
        <View style={{ marginTop: 16 }}>
          <AnimatedButton
            title="Select reminder date/time"
            onPress={() => setDatePickerVisibility(true)}
            backgroundColor={theme.primary}
            color="#fff"
          />
          <Text style={styles.reminderText}>
            {reminderDate.toLocaleString()}
          </Text>
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
        <AnimatedButton
          title="Save"
          onPress={saveNote}
          backgroundColor={theme.primary}
          color="#fff"
        />
      </View>
    </SafeAreaView>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 16,
      backgroundColor: theme.background,
    },
    input: {
      borderWidth: 1,
      borderColor: theme.text,
      color: theme.text,
      backgroundColor: theme.background === '#ffffff' ? '#fff' : '#1e1e1e',
      padding: 12,
      minHeight: 120,
      borderRadius: 12,
      fontSize: 16,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 16,
    },
    label: {
      fontSize: 16,
      color: theme.text,
      marginRight: 8,
    },
    reminderText: {
      marginTop: 8,
      fontSize: 16,
      color: theme.text,
    },
  });
