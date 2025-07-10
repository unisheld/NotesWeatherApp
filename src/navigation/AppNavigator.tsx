import React from 'react';

import { createStackNavigator, TransitionPresets } from '@react-navigation/stack';

import HomeScreen from '../screens/HomeScreen';
import NoteEditorScreen from '../screens/NoteEditorScreen';
import WeatherScreen from '../screens/WeatherScreen';

export type RootStackParamList = {
  Home: undefined;
  NoteEditor: { noteId?: string };
  Weather: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        ...TransitionPresets.SlideFromRightIOS,
        headerShown: true,
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Notes' }} />
      <Stack.Screen name="NoteEditor" component={NoteEditorScreen} options={{ title: 'Edit Note' }} />
      <Stack.Screen name="Weather" component={WeatherScreen} options={{ title: 'Weather' }} />
    </Stack.Navigator>
  );
}
