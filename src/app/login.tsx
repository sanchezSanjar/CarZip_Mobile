import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
  ZoomIn,
} from 'react-native-reanimated';

import { ApiError } from '@/api/graphql';
import { useAuth } from '@/auth/auth-context';
import { Button } from '@/components/button';
import { LogoMark } from '@/components/logo';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

/** login with nickname or phone + password. The server's message is shown as it is (wrong password, blocked...) */
export default function LoginScreen() {
  const { logIn } = useAuth();
  const [nickOrPhone, setNickOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // a refused login shakes the form, like a head saying no
  const shake = useSharedValue(0);
  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.get() }] }));
  const fail = (message: string) => {
    setError(message);
    shake.set(
      withSequence(
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(-7, { duration: 50 }),
        withTiming(7, { duration: 50 }),
        withTiming(0, { duration: 50 }),
      ),
    );
  };

  const submit = async () => {
    if (!nickOrPhone.trim() || !password) return fail('Enter your nickname or phone and your password.');
    setBusy(true);
    setError('');
    try {
      await logIn(nickOrPhone, password);
      router.back();
    } catch (err) {
      fail(err instanceof ApiError ? err.message : 'Could not reach CarZip. Check your connection.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.form}>
        <Animated.View entering={ZoomIn.springify().damping(9)} style={styles.logo}>
          <LogoMark size={76} />
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(120).springify().damping(16)} style={styles.heading}>
          <ThemedText type="subtitle">Welcome back</ThemedText>
          <ThemedText themeColor="textSecondary">Log in with your nickname or phone number.</ThemedText>
        </Animated.View>

        {/* the entrance and the shake both move the view: each needs its own, or one overwrites the other */}
        <Animated.View entering={FadeInDown.delay(220).springify().damping(16)}>
          <Animated.View style={[styles.fields, shakeStyle]}>
            <TextField
              placeholder="Nickname or phone"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="username"
              textContentType="username"
              value={nickOrPhone}
              onChangeText={setNickOrPhone}
            />
            <TextField
              placeholder="Password"
              secureTextEntry
              autoComplete="current-password"
              textContentType="password"
              value={password}
              onChangeText={setPassword}
              onSubmitEditing={submit}
            />
            {!!error && (
              <ThemedText type="smallBold" themeColor="danger">
                {error}
              </ThemedText>
            )}
          </Animated.View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(320).springify().damping(16)}>
          <Button title="Log in" busy={busy} onPress={submit} />
        </Animated.View>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  form: {
    width: '100%',
    maxWidth: 420,
    padding: Spacing.four,
    gap: Spacing.four,
  },
  logo: {
    alignSelf: 'center',
    marginTop: Spacing.four,
  },
  heading: {
    gap: Spacing.one,
    alignItems: 'center',
  },
  fields: {
    gap: Spacing.three,
  },
});
