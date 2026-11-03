import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, TextInput } from 'react-native';

import { ApiError } from '@/api/graphql';
import { useAuth } from '@/auth/auth-context';
import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** login with nickname or phone + password. The server's message is shown as it is (wrong password, blocked...) */
export default function LoginScreen() {
  const theme = useTheme();
  const { logIn } = useAuth();
  const [nickOrPhone, setNickOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!nickOrPhone.trim() || !password) return setError('Enter your nickname or phone and your password.');
    setBusy(true);
    setError('');
    try {
      await logIn(nickOrPhone, password);
      router.back();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not reach CarZip. Check your connection.');
    } finally {
      setBusy(false);
    }
  };

  const inputStyle = [styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }];
  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.form}>
        <ThemedText type="subtitle">Welcome back</ThemedText>
        <TextInput
          style={inputStyle}
          placeholder="Nickname or phone"
          placeholderTextColor={theme.textSecondary}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="username"
          textContentType="username"
          value={nickOrPhone}
          onChangeText={setNickOrPhone}
        />
        <TextInput
          style={inputStyle}
          placeholder="Password"
          placeholderTextColor={theme.textSecondary}
          secureTextEntry
          autoComplete="current-password"
          textContentType="password"
          value={password}
          onChangeText={setPassword}
          onSubmitEditing={submit}
        />
        {!!error && (
          <ThemedText type="small" themeColor="danger">
            {error}
          </ThemedText>
        )}
        <Button title="Log in" busy={busy} onPress={submit} />
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
    gap: Spacing.three,
  },
  input: {
    minHeight: 48,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
    fontSize: 16,
  },
});
