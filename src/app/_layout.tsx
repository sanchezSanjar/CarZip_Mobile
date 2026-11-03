import { ApolloProvider } from '@apollo/client/react';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { Stack } from 'expo-router/stack';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { apolloClient } from '@/api/client';
import { AuthProvider, useAuth } from '@/auth/auth-context';

SplashScreen.preventAutoHideAsync();

function RootStack() {
  const { ready } = useAuth();

  // the splash screen stays until the saved login is checked, so a member never sees the guest screens first
  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);
  if (!ready) return null;

  return (
    <Stack>
      {/* title: what the back button of the screens above the tabs shows */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false, title: 'CarZip' }} />
      <Stack.Screen name="login" options={{ presentation: 'modal', title: 'Log in' }} />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ApolloProvider client={apolloClient}>
      <AuthProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <RootStack />
        </ThemeProvider>
      </AuthProvider>
    </ApolloProvider>
  );
}
