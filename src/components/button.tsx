import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { Brand, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { PressableScale, type PressableScaleProps } from './pressable-scale';

export type ButtonProps = Omit<PressableScaleProps, 'children'> & {
  title: string;
  /** primary: yellow, the main action. dark: black with yellow text. outline: a thin frame. onDark: a frame on black blocks */
  variant?: 'primary' | 'dark' | 'outline' | 'onDark';
  busy?: boolean;
};

const SHINE_WIDTH = 70;

export function Button({ title, variant = 'primary', busy, disabled, onPress, style, ...rest }: ButtonProps) {
  const theme = useTheme();
  const primary = variant === 'primary';
  const width = useSharedValue(0);
  const shine = useSharedValue(0); // 0 = left of the button, 1 = past its right edge

  // the main action catches the eye: every few seconds a light sweeps over it
  useEffect(() => {
    if (!primary) return;
    shine.set(
      withRepeat(
        withSequence(
          withTiming(0, { duration: 0 }),
          withDelay(2400, withTiming(1, { duration: 900, easing: Easing.inOut(Easing.cubic) })),
        ),
        -1,
      ),
    );
  }, [primary, shine]);

  const shineStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -SHINE_WIDTH + shine.get() * (width.get() + 2 * SHINE_WIDTH) }, { skewX: '-20deg' }],
  }));

  const colors = {
    primary: { background: Brand.yellow, text: Brand.ink, border: Brand.yellow },
    dark: { background: Brand.ink, text: Brand.yellow, border: Brand.ink },
    outline: { background: 'transparent', text: theme.text, border: theme.border },
    onDark: { background: 'transparent', text: '#FFFFFF', border: '#3A414B' },
  }[variant];

  return (
    <PressableScale
      accessibilityRole="button"
      disabled={disabled || busy}
      onLayout={(event) => width.set(event.nativeEvent.layout.width)}
      onPress={(event) => {
        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress?.(event);
      }}
      style={[
        styles.button,
        { backgroundColor: colors.background, borderColor: colors.border },
        primary && styles.glow,
        (disabled || busy) && styles.dimmed,
        style,
      ]}
      {...rest}>
      {primary && (
        <Animated.View pointerEvents="none" style={[styles.shine, shineStyle]}>
          <LinearGradient
            colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.65)', 'rgba(255,255,255,0)']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      )}
      {busy ? (
        <ActivityIndicator color={colors.text} />
      ) : (
        <Text style={[styles.label, { color: colors.text }]}>{title}</Text>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    paddingHorizontal: Spacing.four,
    borderRadius: Radius.pill,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  // a soft yellow light under the main button
  glow: {
    shadowColor: Brand.yellow,
    shadowOpacity: 0.45,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  dimmed: {
    opacity: 0.55,
  },
  shine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: SHINE_WIDTH,
  },
  label: {
    fontSize: 16,
    fontWeight: 800,
    letterSpacing: 0.3,
  },
});
