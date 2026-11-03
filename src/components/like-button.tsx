import { useMutation } from '@apollo/client/react';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { Platform, StyleSheet, Text } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';

import { LIKE_CAR } from '@/api/queries';
import { useAuth } from '@/auth/auth-context';
import { Brand } from '@/constants/theme';

import { PressableScale } from './pressable-scale';

/** heart on a car: pops when liked. Guests are sent to the login screen */
export function LikeButton({ carId, liked, size = 40 }: { carId: string; liked: boolean; size?: number }) {
  const { member } = useAuth();
  const [likeCar] = useMutation(LIKE_CAR);
  const pop = useSharedValue(1);
  const popStyle = useAnimatedStyle(() => ({ transform: [{ scale: pop.get() }] }));

  const toggle = () => {
    if (!member) return router.push('/login');
    if (!liked) {
      pop.set(withSequence(withTiming(1.2, { duration: 120 }), withTiming(1, { duration: 160 })));
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    likeCar({ variables: { carId } }).catch(() => undefined); // the cache updates the heart and the count
  };

  return (
    <PressableScale
      onPress={toggle}
      pressedScale={0.85}
      accessibilityRole="button"
      accessibilityLabel={liked ? 'Remove like' : 'Like this car'}
      style={[styles.button, { width: size, height: size, borderRadius: size / 2 }]}>
      <Animated.View style={popStyle}>
        <Text style={[styles.heart, { fontSize: size * 0.5, color: liked ? Brand.yellow : '#FFFFFF' }]}>
          {liked ? '♥' : '♡'}
        </Text>
      </Animated.View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: 'rgba(14,17,22,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heart: {
    fontWeight: 900,
    lineHeight: undefined,
  },
});
