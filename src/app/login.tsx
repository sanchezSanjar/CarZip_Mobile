import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
  } from 'react-native-reanimated';
import { enterUp, enterFade } from '@/constants/motion';

import { ApiError } from '@/api/graphql';
import { translateServerMessage } from '@/i18n';
import { useAuth } from '@/auth/auth-context';
import { Button } from '@/components/button';
import { LogoMark } from '@/components/logo';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

/** login with nickname or phone + password. The server's message is shown as it is (wrong password, blocked...) */
export default function LoginScreen() {
  const { t } = useTranslation();
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
    if (!nickOrPhone.trim() || !password) return fail(t('login.empty'));
    setBusy(true);
    setError('');
    try {
      await logIn(nickOrPhone, password);
      router.back();
    } catch (err) {
      fail(err instanceof ApiError ? translateServerMessage(err.message) : t('common.noConnection'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.form}>
        <Animated.View entering={enterFade()} style={styles.logo}>
          <LogoMark size={76} />
        </Animated.View>
        <Animated.View entering={enterUp(120)} style={styles.heading}>
          <ThemedText type="subtitle">{t('login.welcome')}</ThemedText>
          <ThemedText themeColor="textSecondary">{t('login.subtitle')}</ThemedText>
        </Animated.View>

        {/* the entrance and the shake both move the view: each needs its own, or one overwrites the other */}
        <Animated.View entering={enterUp(220)}>
          <Animated.View style={[styles.fields, shakeStyle]}>
            <TextField
              placeholder={t('login.nickOrPhone')}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="username"
              textContentType="username"
              value={nickOrPhone}
              onChangeText={setNickOrPhone}
            />
            <TextField
              placeholder={t('login.password')}
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

        <Animated.View entering={enterUp(320)}>
          <Button title={t('common.logIn')} busy={busy} onPress={submit} />
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
