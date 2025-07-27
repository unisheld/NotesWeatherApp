import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { SafeAreaView } from 'react-native-safe-area-context';
import uuid from 'react-native-uuid';
import { launchImageLibrary } from 'react-native-image-picker';
import SignatureCanvas from 'react-native-signature-canvas';

import { RootState, AppDispatch } from '../redux/store';
import { addNote, updateNote, Note, NoteType } from '../redux/notesSlice';
import {
  scheduleNotification,
  cancelNotification,
} from '../services/notificationService';

import AnimatedButton from '../components/AnimatedButton';
import { useTheme } from '../theme/useTheme';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import CircularTimePicker from '../components/CircularTimePicker';

type Props = NativeStackScreenProps<RootStackParamList, 'NoteEditor'>;

export default function NoteEditorScreen({ route, navigation }: Props) {
  const { noteId } = route.params || {};
  const dispatch = useDispatch<AppDispatch>();

  const note = useSelector((state: RootState) =>
    state.notes.notes.find(n => n.id === noteId)
  );

  const theme = useTheme();
  const styles = createStyles(theme);
  const sigRef = useRef<any>(null);

  const routeType = route.params?.noteType as NoteType | undefined;
  const noteType: NoteType = note?.type ?? routeType ?? 'text';

  const [content, setContent] = useState(note?.content ?? '');
  const [reminderDate, setReminderDate] = useState(
    note?.reminderDate ? new Date(note.reminderDate) : new Date()
  );
  const [images, setImages] = useState<string[]>(note?.images ?? []);
  const [sketchData, setSketchData] = useState<string | undefined>(note?.sketchData);
  const pendingSketchPromiseRef = useRef<{ resolve: (data: string) => void } | null>(null);

  const handleReminderChange = useCallback((date: Date) => {
    if (date instanceof Date && !isNaN(date.getTime())) {
      setReminderDate(date);
    }
  }, []);

  const handleImagePick = async () => {
    const result = await launchImageLibrary({ mediaType: 'photo', selectionLimit: 1 });
    if (result.assets?.length) {
      const uri = result.assets[0]?.uri;
      if (uri) {
        setImages(prev => [...prev, uri]);
      }
    }
  };

  const handleSketchSave = (data: string) => {
    if (pendingSketchPromiseRef.current) {
      pendingSketchPromiseRef.current.resolve(data);
      pendingSketchPromiseRef.current = null;
    }
    setSketchData(data);
  };

  const getSketchDataAsync = () => {
    return new Promise<string>((resolve) => {
      pendingSketchPromiseRef.current = { resolve };
      sigRef.current?.readSignature();
    });
  };

  const saveNote = async () => {
    let finalSketchData = sketchData;
    if (noteType === 'sketch') {
      try {
        finalSketchData = await getSketchDataAsync();
      } catch (e) {
        console.error('Error to getting sketch', e);
        return;
      }
    }
    const id = noteId ?? uuid.v4().toString();

    const newNote: Note = {
      id,
      content,
      type: noteType,
      reminderDate: noteType === 'reminder' ? reminderDate.toISOString() : undefined,
      images: noteType === 'image' ? images : undefined,
      sketchData: noteType === 'sketch' ? finalSketchData : undefined,
    };

    if (noteId) {
      cancelNotification(id);
      dispatch(updateNote(newNote));
    } else {
      dispatch(addNote(newNote));
    }

    if (noteType === 'reminder' && reminderDate > new Date()) {
      scheduleNotification(id, content || 'Reminder', reminderDate);
    }
    

    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.row}>
          <Text style={styles.label}>Type:</Text>
          <Text style={styles.labelValue}>{noteType}</Text>
        </View>

        {(noteType === 'text' || noteType === 'reminder' || noteType === 'image') && (
          <TextInput
            placeholder="Note content"
            placeholderTextColor={theme.text + '99'}
            value={content}
            onChangeText={setContent}
            multiline
            style={styles.input}
          />
        )}

        {noteType === 'reminder' && (
          <View style={{ marginTop: 16 }}>
            <CircularTimePicker onChange={handleReminderChange} />
          </View>
        )}

        {noteType === 'image' && (
          <>
            <View style={styles.imageContainer}>
              {images.map((uri, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => {
                    setImages(prev => prev.filter((_, i) => i !== idx));
                  }}
                >
                  <Image source={{ uri }} style={styles.image} />
                </TouchableOpacity>
              ))}
            </View>
            <AnimatedButton
              title="Add Image"
              onPress={handleImagePick}
              backgroundColor={theme.primary}
              color="#fff"
            />
            <Text style={styles.imageHint}>Tap image to remove</Text>
          </>
        )}

        {noteType === 'sketch' && (
          <View style={{ marginTop: 16 }}>
            <View style={{ height: 300 }}>
              <SignatureCanvas
                ref={sigRef}
                onOK={handleSketchSave}
                descriptionText="Draw your note"
                backgroundColor={theme.background}
                penColor={theme.text}
                dataURL={sketchData}
                webStyle={`.m-signature-pad--footer {display: none;}`}
              />
            </View>
            <AnimatedButton
              title="Clear Sketch"
              onPress={() => {
                sigRef.current?.clearSignature();
                setSketchData(undefined);
              }}
              backgroundColor="#ff4d4d"
              color="#fff"
              style={{ marginTop: 12, borderRadius: 12 }}
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
      </ScrollView>
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
      backgroundColor:
        theme.background === '#ffffff' ? '#fff' : '#1e1e1e',
      padding: 12,
      minHeight: 120,
      borderRadius: 12,
      fontSize: 16,
      marginTop: 8,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8,
      marginBottom: 4,
    },
    label: {
      fontSize: 16,
      color: theme.text,
    },
    labelValue: {
      fontSize: 16,
      color: theme.primary,
      marginLeft: 8,
    },
    imageContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginVertical: 12,
    },
    image: {
      width: 100,
      height: 100,
      borderRadius: 8,
      marginRight: 8,
    },
    imageHint: {
      textAlign: 'center',
      color: theme.text + '99',
      fontSize: 12,
      marginTop: 4,
    },

  });
