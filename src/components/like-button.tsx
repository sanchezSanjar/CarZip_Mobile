import { useMutation } from '@apollo/client/react';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Alert, Platform, StyleSheet, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';

import { LIKE_CAR } from '@/api/queries';
import { useAuth } from '@/auth/auth-context';
import { Brand } from '@/constants/theme';
import { translateServerMessage } from '@/i18n';

import { PressableScale } from './pressable-scale';

/**
 * Heart on a car. It changes at once on the tap (pop + vibration) and goes back only if the server refuses,
 * with the server's reason. One request at a time: a quick second tap can't undo the first on the way.
 * Guests are sent to the login screen.
 */
export function LikeButton({ carId, liked, size = 40 }: { carId: string; liked: boolean; size?: number }) {
  const { t } = useTranslation();
  const { member } = useAuth();
  const [likeCar] = useMutation(LIKE_CAR);
  const [optimistic, setOptimistic] = useState<boolean | null>(null); // what the tap asked for, until the server answers
  const sending = useRef(false);
  const pop = useSharedValue(1);
  const popStyle = useAnimatedStyle(() => ({ transform: [{ scale: pop.get() }] }));
  const shown = optimistic ?? liked;

  const toggle = async () => {
    if (!member) return router.push('/login');
    if (sending.current) return;
    sending.current = true;
    const next = !shown;
    setOptimistic(next);
    if (next) pop.set(withSequence(withTiming(1.25, { duration: 120 }), withTiming(1, { duration: 160 })));
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await likeCar({ variables: { carId } }); // the cache then holds the server's answer (meLiked, carLikes)
    } catch (err) {
      Alert.alert(err instanceof Error ? translateServerMessage(err.message) : t('common.somethingWrong'));
    } finally {
      sending.current = false;
      setOptimistic(null); // show what the server says from now on
    }
  };

  return (
    <PressableScale
      onPress={toggle}
      pressedScale={0.85}
      hitSlop={12} // easier to hit than the 38-40 px circle, without the car card taking the tap
      accessibilityRole="button"
      accessibilityLabel={shown ? t('car.unlike') : t('car.like')}
      style={[styles.button, { width: size, height: size, borderRadius: size / 2 }]}>
      <Animated.View style={popStyle}>
        <Text style={[styles.heart, { fontSize: size * 0.5, color: shown ? Brand.yellow : '#FFFFFF' }]}>
          {shown ? '♥' : '♡'}
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
