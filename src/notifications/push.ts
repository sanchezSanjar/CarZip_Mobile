import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { router } from 'expo-router';
import { Platform } from 'react-native';

import { graphqlRequest } from '@/api/graphql';
import { getAccessToken } from '@/auth/session';
import { Brand } from '@/constants/theme';

/**
 * Push notifications (backend API.md §18): after login the phone's Expo push token is registered for the
 * member; the backend pushes new private messages and every in-app notification. Logging out on the server
 * removes the phone again.
 */

const REGISTER = `mutation RegisterPushToken($input: PushTokenInput!) { registerPushToken(input: $input) }`;

// the conversation on screen right now: its new messages don't need a banner, they appear in the thread
let openConversationId: string | null = null;
export function setOpenConversation(id: string | null) {
  openConversationId = id;
}

// while the app is open: show the banner, except for the conversation the member is reading
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const data = notification.request.content.data as Record<string, string> | undefined;
    const reading = data?.type === 'message' && data.conversationId === openConversationId;
    return { shouldShowBanner: !reading, shouldShowList: !reading, shouldPlaySound: !reading, shouldSetBadge: false };
  },
});

/** the Expo project id (npx eas init writes it into app.json): no id, no push token */
const projectId = (): string | undefined =>
  Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

/**
 * Asks for permission (once) and registers this phone for the logged-in member. Quietly does nothing in the
 * browser build, in a simulator, without permission or without an Expo project id.
 */
export async function registerForPush(): Promise<void> {
  if (Platform.OS === 'web' || !Device.isDevice) return;
  if (!projectId()) {
    console.warn('[push] no Expo project id: run "npx eas init" in CarZip_Mobile to turn push notifications on');
    return;
  }
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Messages and updates',
        importance: AndroidImportance.HIGH,
        lightColor: Brand.yellow,
        vibrationPattern: [0, 200, 100, 200],
      });
    }
    let { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') status = (await Notifications.requestPermissionsAsync()).status;
    if (status !== 'granted') return;

    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId: projectId() });
    const accessToken = await getAccessToken();
    if (!accessToken) return;
    const devicePlatform = Platform.OS === 'ios' ? 'IOS' : 'ANDROID';
    await graphqlRequest(REGISTER, { input: { token, devicePlatform } }, accessToken);
  } catch (err) {
    console.warn('[push] could not register this phone:', err instanceof Error ? err.message : err);
  }
}

/** a tapped notification opens what it is about: the conversation, or the car */
export function openFromNotification(data: Record<string, unknown> | undefined) {
  if (!data) return;
  if (data.type === 'message' && typeof data.conversationId === 'string') {
    router.push({ pathname: '/conversation/[id]', params: { id: data.conversationId } });
  } else if (typeof data.carId === 'string') {
    router.push({ pathname: '/car/[id]', params: { id: data.carId } });
  }
}
