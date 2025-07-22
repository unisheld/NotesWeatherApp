import React, { useEffect } from 'react';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

import { store, RootState, AppDispatch } from './redux/store';
import AppNavigator from './navigation/AppNavigator';
import { configureNotifications, createNotificationChannel } from './services/notificationService';
import {
  requestExactAlarmPermission,
  requestLocationPermission,
  requestNotificationPermission,
} from './utils/permissions';
import { checkAuthState } from './redux/authSlice';

function Root() {
  const dispatch = useDispatch<AppDispatch>();
  const { user, loading } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    dispatch(checkAuthState());

    (async () => {
      await requestLocationPermission();
      await requestNotificationPermission();
      await requestExactAlarmPermission();
      await createNotificationChannel();
      await configureNotifications();
    })();
  }, [dispatch]);

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

