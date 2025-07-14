import React from 'react';
import { Text, StyleSheet, Pressable, ViewStyle, StyleProp } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';

interface AnimatedButtonProps {
  title: string;
  onPress: () => void;
  backgroundColor?: string;
  color?: string;
  style?: StyleProp<ViewStyle>;
}

export default function AnimatedButton({
  title,
  onPress,
  backgroundColor = '#007bff',
  color = '#fff',
  style,
}: AnimatedButtonProps) {
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
      style={[{ alignSelf: 'center' }, style]}
    >
      <Animated.View style={[styles.button, { backgroundColor }, animatedStyle]}>
        <Text style={[styles.text, { color }]}>{title}</Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  text: {
    fontWeight: '600',
    fontSize: 16,
    textAlign: 'center',
  },
});
