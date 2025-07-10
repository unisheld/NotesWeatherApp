import React from 'react';
import { Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';

interface AnimatedButtonProps {
  title: string;
  onPress: () => void;
}

export default function AnimatedButton({ title, onPress }: AnimatedButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const onPressIn = () => {
    scale.value = withTiming(0.95, { duration: 100, easing: Easing.out(Easing.ease) });
  };

  const onPressOut = () => {
    scale.value = withTiming(1, { duration: 100, easing: Easing.out(Easing.ease) });
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={{ alignSelf: 'center' }}
    >
      <Animated.View style={[styles.button, animatedStyle]}>
        <Text style={styles.text}>{title}</Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#007bff',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  text: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});
