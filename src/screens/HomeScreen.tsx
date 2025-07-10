import React, { useEffect } from 'react';
import { View, FlatList, Button, TouchableOpacity } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../redux/store';
import { deleteNote, setNotes } from '../redux/notesSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import NoteItem from '../components/NoteItem';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const notes = useSelector((state: RootState) => state.notes.notes);
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
  const loadNotes = async () => {
    const json = await AsyncStorage.getItem('notes');
    console.log('Loaded notes from storage:', json);
    if (json) {
      dispatch(setNotes(JSON.parse(json)));
    }
  };
  loadNotes();
}, [dispatch]);

useEffect(() => {
  console.log('Current notes in redux:', notes);
  AsyncStorage.setItem('notes', JSON.stringify(notes));
}, [notes]);


  const handleDelete = (id: string) => {
    dispatch(deleteNote(id));
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Button title="Add Note" onPress={() => navigation.navigate({ name: 'NoteEditor', params: {} })} />

      <Button title="Weather" onPress={() => navigation.navigate('Weather')} />
      <FlatList
        data={notes}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={{ marginBottom: 8, flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity
              onPress={() => navigation.navigate('NoteEditor', { noteId: item.id })}
              style={{ flex: 1 }}
            >
              <NoteItem id={item.id} content={item.content} isReminder={item.type === 'reminder'} />
            </TouchableOpacity>
            <Button title="Delete" onPress={() => handleDelete(item.id)} />
          </View>
        )}
      />
    </View>
  );
}
