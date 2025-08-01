import React from 'react';
import { createStackNavigator, TransitionPresets } from '@react-navigation/stack';
import { useSelector } from 'react-redux';

import HomeScreen from '../screens/HomeScreen';
import NoteEditorScreen from '../screens/NoteEditorScreen';
import WeatherScreen from '../screens/WeatherScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import RoleManagerScreen from '../screens/RoleManagerScreen';

import { RootState } from '../redux/store';
import { NoteType } from '../redux/notesSlice';

import { useRoleGuard } from '../hooks/useRoleGuard';

export type RootStackParamList = {
  Home: undefined;
  NoteEditor: { noteId?: string; noteType?: NoteType; newNote?: any };
  Weather: undefined;
  Login: undefined;
  Register: undefined;
  RoleManager: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const user = useSelector((state: RootState) => state.auth.user);
  const loading = useSelector((state: RootState) => state.auth.loading);
  
  const isAdmin = useRoleGuard('admin');

  if (loading) {
    return null;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        ...TransitionPresets.SlideFromRightIOS,
        headerShown: true,
      }}
    >
      {user ? (
        <>
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ title: 'Notes' }}
          />

          <Stack.Screen
            name="NoteEditor"
            component={NoteEditorScreen}
            options={{ title: 'Edit Note' }}
          />

          <Stack.Screen
            name="Weather"
            component={WeatherScreen}
            options={{ title: 'Weather' }}
          />

          {isAdmin && (
            <Stack.Screen
              name="RoleManager"
              component={RoleManagerScreen}
              options={{ title: 'Manage Roles' }}
            />
          )}
        </>
      ) : (
        <>
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ title: 'Login' }}
          />
          <Stack.Screen
            name="Register"
            component={RegisterScreen}
            options={{ title: 'Register' }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}
