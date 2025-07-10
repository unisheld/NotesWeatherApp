import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  withRepeat,
  withTiming,
  useAnimatedStyle,
  Easing,
} from 'react-native-reanimated';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';

interface NoteItemProps {
  content: string;
  isReminder: boolean;
  id: string;
}

export default function NoteItem({ content, isReminder, id }: NoteItemProps) {
  const pulse = useSharedValue(1);
  const notificationTriggeredId = useSelector((state: RootState) => state.notes.notificationTriggeredId);
  const isNotificationActive = notificationTriggeredId === id;

  useEffect(() => {
    if (isReminder || isNotificationActive) {
      pulse.value = withRepeat(
        withTiming(1.1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
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
      <Text style={styles.content} numberOfLines={5} ellipsizeMode="tail">
        {content}
      </Text>
      {isReminder && <Text style={styles.reminderText}>Reminder</Text>}
      {isNotificationActive && <Text style={styles.notificationText}>Notified!</Text>}
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
  content: {
    fontSize: 14,
    color: '#333',
    flexShrink: 1,
  },
  reminderText: {
    marginTop: 4,
    color: '#d9534f',
    fontWeight: 'bold',
    fontSize: 12,
  },
  notificationText: {
    marginTop: 4,
    color: '#5bc0de',
    fontWeight: '600',
    fontSize: 12,
  },
});
