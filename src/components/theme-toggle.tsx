import * as Haptics from 'expo-haptics';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, StyleSheet, Text } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { Brand } from '@/constants/theme';
import { setThemeChoice, useColorScheme } from '@/hooks/use-color-scheme';

import { PressableScale } from './pressable-scale';

/** the sun / moon button: light for daytime, dark for the evening. The icon turns half a circle on change */
export function ThemeToggle({ size = 46 }: { size?: number }) {
  const { t } = useTranslation();
  const dark = useColorScheme() === 'dark';
  const turn = useSharedValue(dark ? 1 : 0);

  useEffect(() => {
    turn.set(withTiming(dark ? 1 : 0, { duration: 300, easing: Easing.out(Easing.cubic) }));
  }, [dark, turn]);
  const iconStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${turn.get() * 180}deg` }] }));

  return (
    <PressableScale
      onPress={() => {
        if (Platform.OS !== 'web') Haptics.selectionAsync();
        setThemeChoice(dark ? 'light' : 'dark');
      }}
      accessibilityRole="button"
      accessibilityLabel={dark ? t('me.lightMode') : t('me.darkMode')}
      style={[
        styles.button,
        { width: size, height: size, borderRadius: size / 2 },
        dark ? styles.onDark : styles.onLight,
      ]}>
      <Animated.View style={iconStyle}>
        <Text style={[styles.icon, { fontSize: size * 0.45, color: dark ? Brand.yellow : Brand.ink }]}>
          {dark ? '☾' : '☀'}
        </Text>
      </Animated.View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  onLight: {
    backgroundColor: Brand.yellow,
    borderColor: Brand.yellow,
  },
  onDark: {
    backgroundColor: Brand.ink,
    borderColor: '#3A414B',
  },
  icon: {
    fontWeight: 900,
  },
});
