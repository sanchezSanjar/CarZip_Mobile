import { ApolloProvider } from '@apollo/client/react';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { Stack } from 'expo-router/stack';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { startChat } from '@/api/chat';
import { apolloClient } from '@/api/client';
import { AuthProvider, useAuth } from '@/auth/auth-context';
import { Brand, Colors } from '@/constants/theme';
import { loadThemeChoice, useColorScheme } from '@/hooks/use-color-scheme';
import { loadLanguageChoice } from '@/i18n';
import { registerForPush } from '@/notifications/push';
import { useNotificationTap } from '@/notifications/use-notification-tap';

SplashScreen.preventAutoHideAsync();

function RootStack() {
  const { t } = useTranslation();
  const { ready, member } = useAuth();

  // the light / dark choice from last time is read while the splash screen is still up
  useEffect(() => {
    loadThemeChoice();
    loadLanguageChoice();
  }, []);

  // the splash screen stays until the saved login is checked, so a member never sees the guest screens first
  useEffect(() => {
    if (!ready) return;
    SplashScreen.hideAsync();
    startChat(); // the live connection: community room, new private messages and read receipts
  }, [ready]);

  // a logged-in member's phone gets push notifications (asks for permission the first time)
  const memberId = member?._id;
  useEffect(() => {
    if (ready && memberId) registerForPush();
  }, [ready, memberId]);

  useNotificationTap(ready);

  if (!ready) return null;

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Brand.black },
        headerTintColor: Brand.yellow,
        headerTitleStyle: { color: '#FFFFFF', fontWeight: '800' },
        headerShadowVisible: false,
      }}>
      {/* title: what the back button of the screens above the tabs shows */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false, title: 'CarZip' }} />
      <Stack.Screen name="login" options={{ presentation: 'modal', title: t('login.title') }} />
      <Stack.Screen name="car/[id]" options={{ headerShown: false, animation: 'slide_from_right' }} />
      <Stack.Screen name="community" options={{ title: t('community.title'), animation: 'slide_from_right' }} />
      <Stack.Screen name="conversation/[id]" options={{ title: '', animation: 'slide_from_right' }} />
    </Stack>
  );
}

export default function RootLayout() {
  const dark = useColorScheme() === 'dark';
  const base = dark ? DarkTheme : DefaultTheme;
  const colors = Colors[dark ? 'dark' : 'light'];
  // navigation in the CarZip colours: yellow accent, the app's own background
  const theme = { ...base, colors: { ...base.colors, primary: Brand.yellow, background: colors.background } };

  return (
    <ApolloProvider client={apolloClient}>
      <AuthProvider>
        <ThemeProvider value={theme}>
          <StatusBar style={dark ? 'light' : 'dark'} />
          <RootStack />
        </ThemeProvider>
      </AuthProvider>
    </ApolloProvider>
  );
}
