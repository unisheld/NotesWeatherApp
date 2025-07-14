import React, { useEffect } from 'react';
import { View, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { RootState, AppDispatch } from '../redux/store';
import { deleteNote, setNotes } from '../redux/notesSlice';
import { toggleTheme } from '../redux/themeSlice';

import { RootStackParamList } from '../navigation/AppNavigator';
import NoteItem from '../components/NoteItem';
import AnimatedButton from '../components/AnimatedButton';
import { useTheme } from '../theme/useTheme';
import { lightTheme, darkTheme } from '../theme/themes';

const HomeScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'Home'>>();
  const notes = useSelector((state: RootState) => state.notes.notes);
  const dispatch = useDispatch<AppDispatch>();

  const theme = useTheme();
  const styles = createStyles(theme);

  useEffect(() => {
    const loadNotes = async () => {
      const json = await AsyncStorage.getItem('notes');
      if (json) {
        dispatch(setNotes(JSON.parse(json)));
      }
    };
    loadNotes();
  }, [dispatch]);

  useEffect(() => {
    AsyncStorage.setItem('notes', JSON.stringify(notes));
  }, [notes]);

  const handleDelete = (id: string) => {
    dispatch(deleteNote(id));
  };

  return (
    <View style={styles.container}>
      <View style={styles.controlsWrapper}>
        <View style={styles.buttonRow}>
          <AnimatedButton
            title="Add Note"
            onPress={() => navigation.navigate({ name: 'NoteEditor', params: {} })}
            backgroundColor={theme.primary}
            color="#fff"
            style={styles.flexButton}
          />
          <AnimatedButton
            title="Weather"
            onPress={() => navigation.navigate('Weather')}
            backgroundColor={theme.primary}
            color="#fff"
            style={styles.flexButton}
          />
        </View>

        <View style={styles.themeToggleWrapper}>
          <AnimatedButton
            title="Toggle Theme"
            onPress={() => dispatch(toggleTheme())}
            backgroundColor={theme.primary}
            color="#fff"
            style={styles.themeButton}
          />
        </View>
      </View>

      <FlatList
        data={notes}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.notesList}
        renderItem={({ item }) => (
          <Animated.View
            entering={FadeInDown}
            style={[
              styles.noteRow,
              {
                backgroundColor: theme.background === '#ffffff' ? '#f8f8f8' : '#222',
                shadowColor: '#000',
                shadowOpacity: 0.1,
                shadowRadius: 5,
                shadowOffset: { width: 0, height: 2 },
                elevation: 3,
              },
            ]}
          >
            <TouchableOpacity
              onPress={() => navigation.navigate('NoteEditor', { noteId: item.id })}
              style={styles.noteTouchable}
            >
              <NoteItem
                id={item.id}
                content={item.content}
                isReminder={item.type === 'reminder'}
              />
            </TouchableOpacity>
            <AnimatedButton
              title="Delete"
              onPress={() => handleDelete(item.id)}
              backgroundColor="#ff4d4d"
              color="#fff"
              style={styles.deleteButton}
            />
          </Animated.View>
        )}
      />
    </View>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 16,
      backgroundColor: theme.background,
    },
    controlsWrapper: {
      marginTop: 16,
      marginBottom: 16,
    },
    buttonRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 12,
      flexWrap: 'wrap',
      marginBottom: 16,
    },
    flexButton: {
      flex: 1,
      borderRadius: 12,
      paddingVertical: 14,
    },
    themeToggleWrapper: {
      marginTop: 12,
      alignItems: 'center',
    },
    themeButton: {
      width: '50%',
      borderRadius: 12,
      paddingVertical: 14,
    },
    notesList: {
      paddingTop: 12,
      paddingBottom: 24,
    },
    noteRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
      borderRadius: 12,
      overflow: 'hidden',
    },
    noteTouchable: {
      flex: 1,
      paddingVertical: 10,
      paddingHorizontal: 16,
    },
    deleteButton: {
      marginRight: 8,
      paddingHorizontal: 16,
    },
  });

export default HomeScreen;
