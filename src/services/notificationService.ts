import notifee, { TimestampTrigger, TriggerType, EventType } from '@notifee/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { store } from '../redux/store';
import { setNotificationTriggeredId } from '../redux/notesSlice';

const STORAGE_KEY = 'scheduledNotifications';

type ScheduledNotifications = Record<string, string>;

async function loadScheduledNotifications(): Promise<ScheduledNotifications> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    if (json) return JSON.parse(json);
  } catch (e) {
    console.warn('Failed to load scheduled notifications:', e);
  }
  return {};
}

async function saveScheduledNotifications(data: ScheduledNotifications) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to save scheduled notifications:', e);
  }
}

let scheduledNotifications: ScheduledNotifications = {};

export const configureNotificationEvents = () => {
  return notifee.onForegroundEvent(({ type, detail }) => {
    if (type === EventType.DELIVERED || type === EventType.PRESS) {
      const noteId = detail.notification?.data?.noteId;
      if (noteId) {
        console.log('[NotificationService] Notification triggered for noteId:', noteId);
        store.dispatch(setNotificationTriggeredId(String(noteId)));
        setTimeout(() => {
          store.dispatch(setNotificationTriggeredId(null));
        }, 3000);
      }
    }
  });
};

export const configureNotifications = async () => {
  const now = Date.now();

  scheduledNotifications = await loadScheduledNotifications();
  console.log('[NotificationService] Loaded scheduled notifications:', scheduledNotifications);

  for (const noteId of Object.keys(scheduledNotifications)) {
    const notificationId = scheduledNotifications[noteId];
    
    try {
      const notifications = await notifee.getTriggerNotifications();
      const notif = notifications.find(n => n.notification.id === notificationId);

      if (notif) {
        const triggerTimestamp = (notif.trigger as TimestampTrigger).timestamp;

        if (triggerTimestamp <= now) {
                    console.log(`[NotificationService] Missed notification for noteId=${noteId}`);

          await notifee.displayNotification({
            title: 'Missed reminder',
            body: notif.notification.body || 'You missed the reminder',
            android: {
              channelId: 'reminder-channel',
              smallIcon: 'ic_launcher',
            },
          });
          
          delete scheduledNotifications[noteId];
        }
      }
    } catch (e) {
      console.warn(`[NotificationService] Failed to check notification for noteId=${noteId}:`, e);
    }
  }
  
  await saveScheduledNotifications(scheduledNotifications);

  configureNotificationEvents();
};

export const scheduleNotification = async (noteId: string, message: string, date: Date) => { 
  console.log(`[NotificationService] Scheduling notification for noteId=${noteId} at ${date}`);

  
  const trigger: TimestampTrigger = {
    type: TriggerType.TIMESTAMP,
    timestamp: date.getTime(),
    alarmManager: true,
  };


  const notificationId = await notifee.createTriggerNotification(
    {
      title: 'Reminder',
      body: message,
      data: { noteId },
      android: {
        channelId: 'reminder-channel',
        smallIcon: 'ic_launcher', 
      },
    },
    trigger 
  );

  scheduledNotifications[noteId] = notificationId;
  await saveScheduledNotifications(scheduledNotifications);

  console.log(`[NotificationService] Scheduled notificationId=${notificationId} saved`);
};

export const cancelNotification = async (noteId: string) => {
  const notificationId = scheduledNotifications[noteId];
  if (notificationId) {
    console.log(`[NotificationService] Canceling notification for noteId=${noteId} with notificationId=${notificationId}`);
    await notifee.cancelNotification(notificationId);
    delete scheduledNotifications[noteId];
    await saveScheduledNotifications(scheduledNotifications);
  } else {
    console.warn(`[NotificationService] No notification found for noteId=${noteId}`);
  }
};

export const createNotificationChannel = async () => {
  const channelId = await notifee.createChannel({
    id: 'reminder-channel',
    name: 'Reminder Notifications',
    importance: 4,
    vibration: true,
  });
  console.log('[NotificationService] Created notification channel:', channelId);
  return channelId;
};
