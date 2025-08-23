import Geolocation from 'react-native-geolocation-service';
import { Alert } from 'react-native';
import notifee, { AndroidImportance } from '@notifee/react-native';
import { GeoData, Note } from '../redux/notesSlice';
import { requestLocationPermission } from '../utils/permissions';

const DEFAULT_DISTANCE_FILTER = 50;
let watchId: number | null = null;
const triggeredNotes = new Set<string>();

export const startGeoMonitoring = async (notes: Note[]) => {
  console.log('[GeoService] Starting geo monitoring...');
  const hasPermission = await requestLocationPermission();
  if (!hasPermission) {
    Alert.alert('Location permission required for geo reminders');
    console.warn('[GeoService] Location permission denied');
    return;
  }

  if (watchId !== null) {
    console.log('[GeoService] Monitoring already running');
    return;
  }

  watchId = Geolocation.watchPosition(
    ({ coords }) => {
      const { latitude, longitude } = coords;
      console.log('[GeoService] Current position:', latitude, longitude);

      notes.forEach(note => {
        if (note.geoData && isWithinGeoNote({ latitude, longitude }, note.geoData)) {
          if (!triggeredNotes.has(note.id)) {
            console.log('[GeoService] Triggering geo notification for note:', note.id);
            showGeoNotification(note);
            triggeredNotes.add(note.id);
          }
        } else {
          triggeredNotes.delete(note.id);
        }
      });
    },
    error => {
      console.warn('[GeoService] GeoMonitoring error:', error);
    },
    {
      enableHighAccuracy: true,
      distanceFilter: DEFAULT_DISTANCE_FILTER,
      interval: 5000,
      fastestInterval: 2000,
      showLocationDialog: true,
    }
  );

  console.log('[GeoService] Geo monitoring started with watchId:', watchId);
};

export const stopGeoMonitoring = () => {
  if (watchId !== null) {
    Geolocation.clearWatch(watchId);
    watchId = null;
    triggeredNotes.clear();
    console.log('[GeoService] Geo monitoring stopped');
  }
};

export const isWithinGeoNote = (
  current: { latitude: number; longitude: number },
  geoNote: GeoData
): boolean => {
  if (!geoNote.latitude || !geoNote.longitude || !geoNote.radius) return false;

  const distance = getDistanceMeters(current.latitude, current.longitude, geoNote.latitude, geoNote.longitude);
  console.log('[GeoService] Distance to note:', distance, 'meters');
  return distance <= geoNote.radius;
};

export const getDistanceMeters = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371000;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLon/2)**2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

export const showGeoNotification = async (note: Note) => {
  try {
    console.log('[GeoService] Showing notification for note:', note.id);
    await notifee.displayNotification({
      title: 'Geo Reminder',
      body: note.content || 'You entered geo zone',
      android: {
        channelId: 'reminder-channel',
        importance: 4,
        smallIcon: 'ic_launcher',
        pressAction: { id: 'default' },
      },
    });
    console.log('[GeoService] Notification displayed');
  } catch (error) {
    console.warn('[GeoService] Failed to show geo notification:', error);
  }
};

export const testGeoNotification = async () => {
  try {
    console.log('[GeoService] Triggering test geo notification...');
    await notifee.displayNotification({
      title: 'Test Geo Reminder',
      body: 'This is a test geo notification',
      android: {
        channelId: 'reminder-channel',
        smallIcon: 'ic_launcher',
        importance: AndroidImportance.HIGH,
        pressAction: { id: 'default' },
      },
    });
    Alert.alert('Notification', 'Test geo notification should appear now.');
  } catch (err) {
    console.warn('[GeoService] Test notification error:', err);
    Alert.alert('Notification error', String(err));
  }
};
