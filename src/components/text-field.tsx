import { StyleSheet, TextInput, type TextInputProps } from 'react-native';
import Animated, { interpolateColor, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** a text input whose frame lights up yellow while typing */
export function TextField({ onFocus, onBlur, style, ...rest }: TextInputProps) {
  const theme = useTheme();
  const focused = useSharedValue(0);

  const frameStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(focused.get(), [0, 1], [theme.border, theme.brand]),
    shadowOpacity: focused.get() * 0.35,
  }));

  return (
    <Animated.View style={[styles.frame, { backgroundColor: theme.backgroundElement, shadowColor: theme.brand }, frameStyle]}>
      <TextInput
        placeholderTextColor={theme.textSecondary}
        style={[styles.input, { color: theme.text }, style]}
        onFocus={(event) => {
          focused.set(withTiming(1, { duration: 180 }));
          onFocus?.(event);
        }}
        onBlur={(event) => {
          focused.set(withTiming(0, { duration: 180 }));
          onBlur?.(event);
        }}
        {...rest}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  frame: {
    borderWidth: 1.5,
    borderRadius: Radius.medium,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
  input: {
    minHeight: 52,
    paddingHorizontal: Spacing.three,
    fontSize: 16,
    fontWeight: 500,
  },
});
