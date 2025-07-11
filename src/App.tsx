import { useEffect } from 'react';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { store } from './redux/store';
import AppNavigator from './navigation/AppNavigator';
import { configureNotifications, createNotificationChannel } from './services/notificationService';

export default function App() {
  useEffect(() => {
    (async () => {
      await createNotificationChannel();
      await configureNotifications();
    })();
  }, []);

  return (
    <Provider store={store}>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </Provider>
  );
}
