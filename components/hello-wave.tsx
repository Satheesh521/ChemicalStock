import { useEffect } from 'react';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

export function HelloWave() {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withSequence(
        withTiming(25, { duration: 300, easing: Easing.inOut(Easing.ease) }),
        withTiming(-25, { duration: 300, easing: Easing.inOut(Easing.ease) }),
        withTiming(25, { duration: 300, easing: Easing.inOut(Easing.ease) }),
        withTiming(-25, { duration: 300, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 300, easing: Easing.inOut(Easing.ease) })
      ),
      -1, // Infinite repeat
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          rotate: `${rotation.value}deg`,
        },
      ],
    };
  });

  return (
    <Animated.Text
      style={[
        {
          fontSize: 28,
          lineHeight: 32,
          marginTop: -6,
        },
        animatedStyle,
      ]}
    >
      👋
    </Animated.Text>
  );
}
