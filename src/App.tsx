import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './navigation/AppNavigator';
import { store } from './redux/store';
import { configureNotifications, createNotificationChannel } from './services/notificationService';

export default function App() {
  useEffect(() => {
    createNotificationChannel();
    configureNotifications();
  }, []);

  return (
    <Provider store={store}>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </Provider>
  );
}
