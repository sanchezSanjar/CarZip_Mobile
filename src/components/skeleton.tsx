import { useEffect } from 'react';
import { StyleSheet, View, type DimensionValue } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** a grey block that breathes while the real content loads */
export function Skeleton({ width = '100%', height, radius = Radius.small }: { width?: DimensionValue; height: number; radius?: number }) {
  const theme = useTheme();
  const pulse = useSharedValue(0.45);
  useEffect(() => {
    pulse.set(withRepeat(withTiming(1, { duration: 750 }), -1, true));
  }, [pulse]);
  const style = useAnimatedStyle(() => ({ opacity: pulse.get() }));

  return <Animated.View style={[{ width, height, borderRadius: radius, backgroundColor: theme.backgroundSelected }, style]} />;
}

/** the shape of a car card, shown instead of a spinner */
export function CarCardSkeleton() {
  const theme = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
      <Skeleton height={210} radius={0} />
      <View style={styles.text}>
        <Skeleton width="70%" height={18} />
        <Skeleton width="45%" height={14} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.large,
    borderWidth: 1,
    overflow: 'hidden',
  },
  text: {
    padding: Spacing.three,
    gap: Spacing.two,
  },
});
