import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Image,
  ScrollView,
} from 'react-native';
import Animated, {
  useSharedValue,
  withRepeat,
  withTiming,
  useAnimatedStyle,
  Easing,
} from 'react-native-reanimated';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import { NoteType } from '../redux/notesSlice';

interface NoteItemProps {
  id: string;
  content: string;
  type: NoteType;
  images?: string[];
  sketchData?: string;
  reminderDate?: string;
  geoData?: { latitude: number; longitude: number; radius: number };
}

export default function NoteItem({
  id,
  content,
  type,
  images,
  sketchData,
  reminderDate,
  geoData,
}: NoteItemProps) {
  const pulse = useSharedValue(1);

  const notificationTriggeredId = useSelector(
    (state: RootState) => state.notes.notificationTriggeredId
  );
  const isNotificationActive = notificationTriggeredId === id;
  const isReminder = type === 'reminder';

  useEffect(() => {
    if (isReminder || isNotificationActive) {
      pulse.value = withRepeat(
        withTiming(1.05, {
          duration: 800,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true
      );
    } else {
      pulse.value = withTiming(1, { duration: 300 });
    }
  }, [isReminder, isNotificationActive]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <Text style={styles.typeLabel}>{type.toUpperCase()}</Text>

      {(type === 'text' || type === 'reminder' || type === 'image') && (
        <Text style={styles.content}>{content}</Text>
      )}

      {isReminder && (
        <Text style={styles.reminderLabel}>Reminder</Text>
      )}

      {type === 'reminder' && reminderDate && (
        <View>
          {isNotificationActive && (
            <Text style={styles.notificationText}>Notified!</Text>
          )}
        </View>
      )}

      {type === 'image' && images && images.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginTop: 6 }}
        >
          {images.map((uri, idx) => (
            <Image
              key={idx}
              source={{ uri }}
              style={styles.image}
              resizeMode="cover"
            />
          ))}
        </ScrollView>
      )}

      {type === 'sketch' ? (
        sketchData ? (
          <Image
            source={{ uri: sketchData }}
            style={styles.sketch}
            resizeMode="contain"
          />
        ) : (
          <View style={[styles.sketch, styles.sketchPlaceholder]}>
            <Text style={styles.placeholderText}>No sketch available</Text>
          </View>
        )
      ) : null}

      {type === 'geo' && geoData && (
        <View style={styles.geoContainer}>
          <Text style={styles.geoLabel}>Geo Reminder</Text>
          <Text style={styles.geoText}>
            Lat: {geoData.latitude.toFixed(3)}, Lon: {geoData.longitude.toFixed(3)}
          </Text>
          <Text style={styles.geoText}>Radius: {geoData.radius} m</Text>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
    marginVertical: 6,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    maxWidth: Dimensions.get('window').width - 32,
    alignSelf: 'center',
  },
  typeLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
    fontWeight: '600',
  },
  content: {
    fontSize: 14,
    color: '#333',
  },
  reminderLabel: {
    marginTop: 4,
    color: '#d9534f',
    fontWeight: 'bold',
    fontSize: 12,
  },
  reminder: {
    fontSize: 13,
    color: '#f57c00',
    marginTop: 4,
  },
  notificationText: {
    fontSize: 13,
    color: '#007aff',
    marginTop: 2,
    fontWeight: '600',
  },
  image: {
    width: 120,
    height: 120,
    borderRadius: 8,
    marginRight: 8,
  },
  sketch: {
    width: '100%',
    height: 140,
    borderRadius: 8,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  sketchPlaceholder: {
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
  },
  placeholderText: {
    color: '#999',
    textAlign: 'center',
    marginTop: 60,
  },
  geoContainer: {
    marginTop: 6,
    padding: 6,
    borderWidth: 1,
    borderColor: '#4caf50',
    borderRadius: 6,
    backgroundColor: '#e8f5e9',
  },
  geoLabel: {
    fontWeight: 'bold',
    fontSize: 12,
    color: '#2e7d32',
    marginBottom: 2,
  },
  geoText: {
    fontSize: 12,
    color: '#2e7d32',
  },
});
