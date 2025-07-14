import { useEffect } from 'react';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { store } from './redux/store';
import AppNavigator from './navigation/AppNavigator';
import { configureNotifications, createNotificationChannel } from './services/notificationService';
import { requestExactAlarmPermission, requestLocationPermission, requestNotificationPermission } from './utils/permissions';

export default function App() {
  useEffect(() => {
    (async () => {
      await requestLocationPermission();
      await requestNotificationPermission();
      await requestExactAlarmPermission();
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
