import { ActivityIndicator, Pressable, StyleSheet, type PressableProps } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { ThemedText } from './themed-text';

export type ButtonProps = PressableProps & {
  title: string;
  /** primary: brand colour (the main action), secondary: grey */
  variant?: 'primary' | 'secondary';
  busy?: boolean;
};

export function Button({ title, variant = 'primary', busy, disabled, style, ...rest }: ButtonProps) {
  const theme = useTheme();
  const primary = variant === 'primary';

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || busy}
      style={(state) => [
        styles.button,
        { backgroundColor: primary ? theme.brand : theme.backgroundElement },
        (state.pressed || disabled || busy) && styles.dimmed,
        typeof style === 'function' ? style(state) : style,
      ]}
      {...rest}>
      {busy ? (
        <ActivityIndicator color={primary ? theme.onBrand : theme.text} />
      ) : (
        <ThemedText type="smallBold" themeColor={primary ? 'onBrand' : 'text'}>
          {title}
        </ThemedText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    paddingHorizontal: Spacing.four,
    borderRadius: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dimmed: {
    opacity: 0.6,
  },
});
