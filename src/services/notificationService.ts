import PushNotification from 'react-native-push-notification';
import { Platform } from 'react-native';
import { store } from '../redux/store';
import { setNotificationTriggeredId } from '../redux/notesSlice';

export const createNotificationChannel = () => {
  if (Platform.OS === 'android') {
    PushNotification.createChannel(
      {
        channelId: 'reminder-channel', 
        channelName: 'Reminder Notifications', 
        importance: 4, 
        vibrate: true,
      },
      (created) => console.log(`[NotificationService] createChannel returned '${created}'`)
    );
  }
};

export const configureNotifications = () => {
  PushNotification.configure({
    onRegister: function (token) {
      console.log('[NotificationService] onRegister:', token);
    },
    onNotification: function (notification: any) {
      console.log('[NotificationService] onNotification:', notification);

      const noteId = notification.id || notification.data?.id || notification.userInfo?.id;
      console.log('[NotificationService] extracted noteId:', noteId);

      if (noteId) {
        store.dispatch(setNotificationTriggeredId(noteId.toString()));
        console.log(`[NotificationService] dispatched setNotificationTriggeredId(${noteId.toString()})`);

        setTimeout(() => {
          store.dispatch(setNotificationTriggeredId(null));
          console.log('[NotificationService] reset notificationTriggeredId to null');
        }, 3000);
      }

      if (Platform.OS === 'ios') {
        // notification.finish(PushNotification.FetchResult.NoData);
        console.log('[NotificationService] iOS notification finished');
      }
    },
    onAction: function (notification) {
      console.log('[NotificationService] onAction:', notification.action, notification);
    },
    onRegistrationError: function(err) {
      console.error('[NotificationService] onRegistrationError:', err.message, err);
    },
    permissions: {
      alert: true,
      badge: true,
      sound: true,
    },
    popInitialNotification: true,
    requestPermissions: Platform.OS === 'ios',
  });
};

export const scheduleNotification = (id: string, message: string, date: Date) => {
  console.log(`[NotificationService] Scheduling notification id=${id} at ${date.toISOString()}`);
  PushNotification.localNotificationSchedule({
    id: id.toString(),
    channelId: 'reminder-channel',
    message,
    date,
    allowWhileIdle: true,    
    playSound: true,
    soundName: 'default',
  });
};

export const cancelNotification = (id: string) => {
  console.log(`[NotificationService] Canceling notification id=${id}`);
  PushNotification.cancelLocalNotification(id.toString());

};
