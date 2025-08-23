import React, { useEffect } from 'react';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { ActivityIndicator, View, StyleSheet, Alert } from 'react-native';

import { store, RootState, AppDispatch } from './redux/store';
import AppNavigator from './navigation/AppNavigator';
import { configureNotifications, createNotificationChannel } from './services/notificationService';
import {
  requestExactAlarmPermission,
  requestLocationPermission,
  requestNotificationPermission,
} from './utils/permissions';
import { checkAuthState } from './redux/authSlice';
import { startGeoMonitoring, stopGeoMonitoring } from './services/geoService';

function Root() {
  const dispatch = useDispatch<AppDispatch>();
  const { user, loading } = useSelector((state: RootState) => state.auth);
  const notes = useSelector((state: RootState) => state.notes.notes);

  useEffect(() => {
    dispatch(checkAuthState());

    (async () => {
      const locationGranted = await requestLocationPermission();
      await requestNotificationPermission();
      await requestExactAlarmPermission();
      await createNotificationChannel();
      await configureNotifications();

      if (!locationGranted) {
        Alert.alert('Location permission required for geo reminders');
      }
    })();
  }, [dispatch]);
  
  useEffect(() => {
    if (!notes.length) return;

    stopGeoMonitoring();

    startGeoMonitoring(notes);
  }, [notes]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <AppNavigator />;
}

export default function App() {
  return (
    <Provider store={store}>
      <NavigationContainer>
        <Root />
      </NavigationContainer>
    </Provider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
