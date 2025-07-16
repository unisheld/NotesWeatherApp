import React, { useEffect, useCallback, useState } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import Svg, {
  Circle,
  G,
  Defs,
  LinearGradient,
  Stop,
  Path,
  Text as SvgText,
  Line,
} from 'react-native-svg';
import {
  GestureHandlerRootView,
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
} from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  useAnimatedGestureHandler,
  useDerivedValue,
  runOnJS,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const SIZE = width * 0.9;
const RADIUS = SIZE / 2;
const CENTER = { x: SIZE / 2, y: SIZE / 2 };

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type Props = {
  onChange: (date: Date) => void;
};

const polarToCartesian = (
  cx: number,
  cy: number,
  radius: number,
  angleInDegrees: number
) => {
  'worklet';
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: cx + radius * Math.cos(angleInRadians),
    y: cy + radius * Math.sin(angleInRadians),
  };
};

const describeArc = (
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number
) => {
  'worklet';
  const start = polarToCartesian(cx, cy, radius, endAngle);
  const end = polarToCartesian(cx, cy, radius, startAngle);
  const largeArcFlag = Math.abs(endAngle - startAngle) <= 180 ? '0' : '1';
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
};

const describeGradientArc = (
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number
) => {
  'worklet';

  const segments: string[] = [];

  let currentStart = startAngle;
  while (currentStart < endAngle) {
    const currentEnd = Math.min(currentStart + 180, endAngle);
    segments.push(describeArc(cx, cy, radius, currentStart, currentEnd));
    currentStart = currentEnd;
  }

  return segments.join(' ');
};

const CircularTimePicker = ({ onChange }: Props) => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const updateNow = () => setNow(new Date());

    const msUntilNextMinute =
      60000 - (new Date().getSeconds() * 1000 + new Date().getMilliseconds());

    const timeoutId = setTimeout(() => {
      updateNow();

      const intervalId = setInterval(updateNow, 60000);

      return () => clearInterval(intervalId);
    }, msUntilNextMinute);

    updateNow();

    return () => clearTimeout(timeoutId);
  }, []);

  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const [selectedTimeStr, setSelectedTimeStr] = useState('');
  const [selectedDateStr, setSelectedDateStr] = useState('');

  const [gradientCoordState, setGradientCoordState] = useState({
    x1: 0,
    y1: 0,
    x2: 0,
    y2: 0,
  });

  const angle = useSharedValue((nowMinutes / 1440) * 360);

  const angleToTime = (angleValue: number) => {
    'worklet';
    const totalMinutes = Math.round((angleValue / 360) * 1440);
    const dayOffset = Math.floor(totalMinutes / 1440);
    const minutesInDay = totalMinutes % 1440;
    const hours = Math.floor(minutesInDay / 60);
    const minutes = minutesInDay % 60;
    return { hours, minutes, dayOffset };
  };

  const notifyChange = useCallback(
    (timestamp: number) => {
      onChange(new Date(timestamp));
    },
    [onChange]
  );

  const gestureHandler = useAnimatedGestureHandler<
    PanGestureHandlerGestureEvent
  >({
    onActive: (event) => {
      const x = event.x - CENTER.x;
      const y = event.y - CENTER.y;
      let newAngle = Math.atan2(y, x) * (180 / Math.PI) + 90;
      if (newAngle < 0) newAngle += 360;

      const baseCircleCount = Math.floor(angle.value / 360);
      let candidateAngle = baseCircleCount * 360 + newAngle;

      const diff = candidateAngle - angle.value;
      if (diff < -180) candidateAngle += 360;
      else if (diff > 180) candidateAngle -= 360;

      const { hours, minutes, dayOffset } = angleToTime(candidateAngle);

      const nowMs = Date.now();
      const date = new Date();
      date.setDate(date.getDate() + dayOffset);
      date.setHours(hours, minutes, 0, 0);
      const selectedMs = date.getTime();

      if (selectedMs >= nowMs) {
        angle.value = candidateAngle;
        runOnJS(notifyChange)(selectedMs);
      }
    },
  });

  useDerivedValue(() => {
    const { hours, minutes, dayOffset } = angleToTime(angle.value);
    const date = new Date();
    date.setDate(date.getDate() + dayOffset);
    date.setHours(hours, minutes, 0, 0);

    const timeStr = `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}`;

    const dateStr = date.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    runOnJS(setSelectedTimeStr)(timeStr);
    runOnJS(setSelectedDateStr)(dateStr);
  });

  useDerivedValue(() => {
    const startAngle = (nowMinutes / 1440) * 360;
    const endAngle = angle.value;

    const start = polarToCartesian(CENTER.x, CENTER.y, RADIUS, startAngle);
    const end = polarToCartesian(CENTER.x, CENTER.y, RADIUS, endAngle);

    runOnJS(setGradientCoordState)({
      x1: start.x,
      y1: start.y,
      x2: end.x,
      y2: end.y,
    });
  });

  const animatedArcProps = useAnimatedProps(() => {
    const startAngle = (nowMinutes / 1440) * 360;
    const endAngle = angle.value;
    return {
      d: describeGradientArc(CENTER.x, CENTER.y, RADIUS - 40, startAngle, endAngle),
    };
  });

  const currentAngle = (nowMinutes / 1440) * 360;

  const currentPos = useDerivedValue(() =>
    polarToCartesian(CENTER.x, CENTER.y, RADIUS - 35, currentAngle)
  );

  const selectedPos = useDerivedValue(() =>
    polarToCartesian(CENTER.x, CENTER.y, RADIUS - 35, angle.value)
  );

  const animatedCurrentCircleProps = useAnimatedProps(() => ({
    cx: currentPos.value.x,
    cy: currentPos.value.y,
  }));

  const animatedSelectedCircleProps = useAnimatedProps(() => ({
    cx: selectedPos.value.x,
    cy: selectedPos.value.y,
  }));

  const hourMarks = Array.from({ length: 24 }, (_, i) => i);
  const sixHourMarks = [0, 6, 12, 18];
  const twentyMinMarks = Array.from({ length: 72 }, (_, i) => i);

  const currentTimeString = `${now
    .getHours()
    .toString()
    .padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  return (
    <GestureHandlerRootView style={styles.container}>
      <PanGestureHandler onGestureEvent={gestureHandler}>
        <Animated.View>
          <View style={styles.svgContainer}>
            <Svg width={SIZE} height={SIZE}>
              <Defs>
                <LinearGradient
                  id="gradient"
                  x1={gradientCoordState.x1}
                  y1={gradientCoordState.y1}
                  x2={gradientCoordState.x2}
                  y2={gradientCoordState.y2}
                  gradientUnits="userSpaceOnUse"
                >
                  <Stop offset="0%" stopColor="#4f6df5" />
                  <Stop offset="100%" stopColor="#f5a623" />
                </LinearGradient>
              </Defs>

              <G>
                <Circle
                  cx={CENTER.x}
                  cy={CENTER.y}
                  r={RADIUS - 40}
                  fill="#fafafa"
                  stroke="#ddd"
                  strokeWidth={8}
                />

                <AnimatedPath
                  animatedProps={animatedArcProps}
                  stroke="url(#gradient)"
                  strokeWidth={12}
                  fill="none"
                  strokeLinecap="round"
                />

                {twentyMinMarks.map((mark) => {
                  const angleDeg = mark * 20 * (360 / 1440);
                  if (mark % 3 === 0) return null;
                  const start = polarToCartesian(CENTER.x, CENTER.y, RADIUS - 60, angleDeg);
                  const end = polarToCartesian(CENTER.x, CENTER.y, RADIUS - 68, angleDeg);
                  return (
                    <Line
                      key={`twenty-${mark}`}
                      x1={start.x}
                      y1={start.y}
                      x2={end.x}
                      y2={end.y}
                      stroke="#aaa"
                      strokeWidth={1}
                      opacity={0.5}
                    />
                  );
                })}

                {hourMarks.map((hour) => {
                  const angleDeg = (hour / 24) * 360;
                  if (sixHourMarks.includes(hour)) {
                    const pos = polarToCartesian(CENTER.x, CENTER.y, RADIUS - 70, angleDeg);
                    return (
                      <SvgText
                        key={`label-${hour}`}
                        x={pos.x}
                        y={pos.y + 6}
                        fontSize={16}
                        fontWeight="700"
                        fill="#444"
                        textAnchor="middle"
                      >
                        {hour.toString().padStart(2, '0')}
                      </SvgText>
                    );
                  } else {
                    const start = polarToCartesian(CENTER.x, CENTER.y, RADIUS - 60, angleDeg);
                    const end = polarToCartesian(CENTER.x, CENTER.y, RADIUS - 72, angleDeg);
                    return (
                      <Line
                        key={`hour-line-${hour}`}
                        x1={start.x}
                        y1={start.y}
                        x2={end.x}
                        y2={end.y}
                        stroke="#666"
                        strokeWidth={2}
                      />
                    );
                  }
                })}

                <AnimatedCircle
                  animatedProps={animatedCurrentCircleProps}
                  r={10}
                  fill="#4f6df5"
                  stroke="#fff"
                  strokeWidth={3}
                />

                <AnimatedCircle
                  animatedProps={animatedSelectedCircleProps}
                  r={14}
                  fill="#f5a623"
                  stroke="#fff"
                  strokeWidth={3}
                />
              </G>
            </Svg>
          </View>

          <View style={styles.centerTimeContainer} pointerEvents="none">
            <Text style={styles.label}>Current Time</Text>
            <Text style={styles.currentTimeText}>{currentTimeString}</Text>

            <Text style={[styles.label, { marginTop: 14 }]}>Reminder Date</Text>
            <Text style={styles.dateText}>{selectedDateStr}</Text>

            <Text style={styles.label}>Reminder Time</Text>
            <Text style={styles.selectedTimeText}>{selectedTimeStr}</Text>
          </View>
        </Animated.View>
      </PanGestureHandler>
    </GestureHandlerRootView>
  );
};

export default React.memo(CircularTimePicker);

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    marginVertical: 24,
  },
  svgContainer: {
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  centerTimeContainer: {
    position: 'absolute',
    top: CENTER.y - 70,
    left: CENTER.x - 80,
    width: 160,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: 12,
    color: '#888',
  },
  currentTimeText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#4f6df5',
  },
  selectedTimeText: {
    fontSize: 30,
    fontWeight: '900',
    color: '#f5a623',
    letterSpacing: 1,
    marginTop: 2,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginTop: 4,
  },
});
