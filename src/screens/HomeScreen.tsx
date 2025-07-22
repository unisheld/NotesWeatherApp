import React, { useEffect } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Text,
  ListRenderItemInfo,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { RootState, AppDispatch } from '../redux/store';
import { deleteNote, setNotes } from '../redux/notesSlice';
import { toggleTheme } from '../redux/themeSlice';
import { logoutUser } from '../redux/authSlice';

import { RootStackParamList } from '../navigation/AppNavigator';
import NoteItem from '../components/NoteItem';
import AnimatedButton from '../components/AnimatedButton';
import { useTheme } from '../theme/useTheme';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

interface Note {
  id: string;
  content: string;
  type?: string;
}

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const notes = useSelector((state: RootState) => state.notes.notes);
  const userEmail = useSelector((state: RootState) => state.auth.user?.email || 'Guest');
  const dispatch = useDispatch<AppDispatch>();
  const theme = useTheme();
  
  const styles = createStyles(theme);

  useEffect(() => {
    (async () => {
      const json = await AsyncStorage.getItem('notes');
      if (json) {
        dispatch(setNotes(JSON.parse(json)));
      }
    })();
  }, [dispatch]);

  useEffect(() => {
    AsyncStorage.setItem('notes', JSON.stringify(notes));
  }, [notes]);
 
  const handleDelete = (id: string) => {
    dispatch(deleteNote(id));
  };

  const handleLogout = async () => {
    await dispatch(logoutUser());
  };

  const renderItem = ({ item }: ListRenderItemInfo<Note>) => (
    <Animated.View
      entering={FadeInDown}
      style={[styles.noteRow, styles.noteRowBackground]}
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
  );

  return (
    <View style={styles.container}>
      <View style={styles.userInfoWrapper}>
        <Text style={[styles.userText, { color: theme.text }]}>
          Hello, {userEmail}
        </Text>
      </View>

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
          <AnimatedButton
            title="Logout"
            onPress={handleLogout}
            backgroundColor="#999"
            color="#fff"
            style={[styles.themeButton, { marginTop: 12 }]}
          />
        </View>
      </View>

      <FlatList
        data={notes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.notesList}
        renderItem={renderItem}
      />
    </View>
  );
}

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 16,
      backgroundColor: theme.background,
    },
    userInfoWrapper: {
      alignItems: 'center',
      marginBottom: 12,
    },
    userText: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.text,
    },
    controlsWrapper: {
      marginVertical: 16,
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
      shadowColor: '#000',
      shadowOpacity: 0.1,
      shadowRadius: 5,
      shadowOffset: { width: 0, height: 2 },
      elevation: 3,
    },
    noteRowBackground: {
      backgroundColor: theme.background === '#ffffff' ? '#f8f8f8' : '#222',
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
