import { Linking, PermissionsAndroid, Platform, Alert } from 'react-native';

export const requestLocationPermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') return true;

  const hasPermission = await PermissionsAndroid.check(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
  );
  if (hasPermission) return true;

  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    {
      title: 'Location Permission',
      message: 'App needs access to your location to show weather info',
      buttonNeutral: 'Ask Me Later',
      buttonNegative: 'Cancel',
      buttonPositive: 'OK',
    }
  );

  if (granted === PermissionsAndroid.RESULTS.GRANTED) {
    console.log('Location permission granted');
    return true;
  } else {
    console.warn('Location permission denied');
    Alert.alert(
      'Permission denied',
      'Location permission is required to show weather info.',
      [{ text: 'OK' }]
    );
    return false;
  }
};

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'android' || Platform.Version < 33) return true;

  const hasPermission = await PermissionsAndroid.check(
    'android.permission.POST_NOTIFICATIONS' as any
  );
  if (hasPermission) return true;

  const granted = await PermissionsAndroid.request(
    'android.permission.POST_NOTIFICATIONS' as any,
    {
      title: 'Notification Permission',
      message: 'App needs permission to send you notifications',
      buttonNeutral: 'Ask Me Later',
      buttonNegative: 'Cancel',
      buttonPositive: 'OK',
    }
  );

  if (granted === PermissionsAndroid.RESULTS.GRANTED) {
    console.log('Notification permission granted');
    return true;
  } else {
    console.warn('Notification permission denied');
    Alert.alert(
      'Permission denied',
      'Notification permission is required to send you notifications.',
      [{ text: 'OK' }]
    );
    return false;
  }
};

export const requestExactAlarmPermission = async (): Promise<void> => {
  if (Platform.OS === 'android' && Platform.Version >= 31) {
    Alert.alert(
      'Exact Alarm Permission',
      'Please allow Exact Alarm permission in the settings for correct alarm behavior.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open Settings',
          onPress: async () => {
            try {
              await Linking.openSettings();
              console.log('Opened settings for Exact Alarm permission');
            } catch (error) {
              console.warn('Failed to open exact alarm settings', error);
              Alert.alert('Error', 'Could not open settings.');
            }
          },
        },
      ]
    );
  }
};

