import React, { useState, useEffect } from 'react';
import {
  View,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  ListRenderItemInfo,
  Alert,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Modal from 'react-native-modal';

import { RootState, AppDispatch } from '../redux/store';
import { deleteNote, setNotes, Note, NoteType } from '../redux/notesSlice';
import { toggleTheme } from '../redux/themeSlice';
import { logoutUser } from '../redux/authSlice';

import { RootStackParamList } from '../navigation/AppNavigator';
import NoteItem from '../components/NoteItem';
import AnimatedButton from '../components/AnimatedButton';
import { useTheme } from '../hooks/useTheme';
import uuid from 'react-native-uuid';

import { useRoleGuard } from '../hooks/useRoleGuard';
import { useIsAdmin } from '../hooks/useIsAdmin';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const notes = useSelector((state: RootState) => state.notes.notes);
  const userEmail = useSelector((state: RootState) => state.auth.user?.email || 'Guest');
  const dispatch = useDispatch<AppDispatch>();
  const theme = useTheme();
  const styles = createStyles(theme);

  const canEdit = useRoleGuard('editor');
  const isAdmin = useIsAdmin();

  const [isModalVisible, setModalVisible] = useState(false);

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
    if (!canEdit) {
      Alert.alert('Access denied', 'You do not have permission to delete notes.');
      return;
    }
    dispatch(deleteNote(id));
  };

  const handleLogout = async () => {
    await dispatch(logoutUser());
  };

  const handleLongPressOnList = () => {
    if (!canEdit) {
      Alert.alert('Access denied', 'You do not have permission to create notes.');
      return;
    }
    setModalVisible(true);
  };

  const handleSelectNoteType = (type: NoteType) => {
    setModalVisible(false);

    const newNote: Note = {
      id: uuid.v4().toString(),
      type,
      content: '',
      reminderDate: type === 'reminder' ? new Date().toISOString() : undefined,
      images: type === 'image' ? [] : undefined,
      sketchData: type === 'sketch' ? '' : undefined,
    };

    navigation.navigate('NoteEditor', { noteId: undefined, noteType: type, newNote });
  };

  const openNoteEditor = (type: NoteType, id: string) => {
    if (!canEdit) {
      Alert.alert('Access denied', 'You do not have permission to edit notes.');
      return;
    }
    navigation.navigate('NoteEditor', { noteId: id, noteType: type });
  };

  const renderItem = ({ item }: ListRenderItemInfo<Note>) => (
    <Animated.View entering={FadeInDown} style={[styles.noteRow, styles.noteRowBackground]}>
      <Pressable
        onPress={() => openNoteEditor(item.type, item.id)}
        onLongPress={handleLongPressOnList}
        style={styles.noteTouchable}
      >
        <NoteItem
          id={item.id}
          content={item.content}
          type={item.type}
          images={item.images}
          sketchData={item.sketchData}
        />
      </Pressable>
      {canEdit && (
        <AnimatedButton
          title="Delete"
          onPress={() => handleDelete(item.id)}
          backgroundColor="#ff4d4d"
          color="#fff"
          style={styles.deleteButton}
        />
      )}
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.userInfoWrapper}>
        <Text style={[styles.userText, { color: theme.text }]}>
          Hello, {userEmail} ({isAdmin ? 'admin' : canEdit ? 'editor' : 'user'})
        </Text>
      </View>

      <View style={styles.controlsWrapper}>
        <View style={styles.buttonRow}>
          <AnimatedButton
            title="Weather"
            onPress={() => navigation.navigate('Weather')}
            backgroundColor={theme.primary}
            color="#fff"
            style={styles.flexButton}
          />
          <AnimatedButton
            title="Toggle Theme"
            onPress={() => dispatch(toggleTheme())}
            backgroundColor={theme.primary}
            color="#fff"
            style={styles.flexButton}
          />
        </View>

        {isAdmin && (
          <View style={styles.buttonRow}>
            <AnimatedButton
              title="Manage Roles"
              onPress={() => navigation.navigate('RoleManager')}
              backgroundColor={theme.primary}
              color="#fff"
              style={styles.flexButton}
            />
          </View>
        )}

        <View style={styles.buttonRow}>
          <AnimatedButton
            title="Logout"
            onPress={handleLogout}
            backgroundColor="#999"
            color="#fff"
            style={styles.flexButton}
          />
        </View>
      </View>

      {notes.length === 0 ? (
        <Pressable onLongPress={handleLongPressOnList} style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: theme.text }]}>
            No notes yet. Long press anywhere to create one.
          </Text>
        </Pressable>
      ) : (
        <FlatList
          data={notes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.notesList}
          renderItem={renderItem}
        />
      )}

      <Modal
        isVisible={isModalVisible}
        onBackdropPress={() => setModalVisible(false)}
        backdropOpacity={0.4}
        animationIn="zoomIn"
        animationOut="zoomOut"
        useNativeDriver
        style={styles.modalWrapper}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Choose note type</Text>
          <AnimatedButton
            title="Note"
            onPress={() => handleSelectNoteType('text')}
            backgroundColor={theme.primary}
            color="#fff"
            style={styles.modalButton}
          />
          <AnimatedButton
            title="Reminder"
            onPress={() => handleSelectNoteType('reminder')}
            backgroundColor={theme.primary}
            color="#fff"
            style={styles.modalButton}
          />
          <AnimatedButton
            title="Sketch"
            onPress={() => handleSelectNoteType('sketch')}
            backgroundColor={theme.primary}
            color="#fff"
            style={styles.modalButton}
          />
          <AnimatedButton
            title="Image"
            onPress={() => handleSelectNoteType('image')}
            backgroundColor={theme.primary}
            color="#fff"
            style={styles.modalButton}
          />
        </View>
      </Modal>
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
      marginHorizontal: 4,
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
      flex: 1,
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
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    emptyText: {
      fontSize: 16,
      fontStyle: 'italic',
      textAlign: 'center',
    },
    modalContent: {
      backgroundColor: theme.background,
      padding: 24,
      borderRadius: 16,
      alignItems: 'center',
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.text,
      marginBottom: 16,
    },
    modalButton: {
      marginVertical: 8,
      borderRadius: 12,
      paddingVertical: 14,
      width: 200,
    },
    modalWrapper: {
      justifyContent: 'center',
      alignItems: 'center',
      margin: 0,
    },
  });
