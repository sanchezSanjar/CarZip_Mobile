import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// expo-secure-store has no browser version. The web build is only for development, so it uses localStorage there
const isWeb = Platform.OS === 'web';

/** Keychain (iOS) / Keystore (Android): only this app can read it, and it is not in device backups */
export const secureStorage = {
  get(key: string): Promise<string | null> {
    if (isWeb) return Promise.resolve(globalThis.localStorage?.getItem(key) ?? null);
    return SecureStore.getItemAsync(key);
  },
  async set(key: string, value: string): Promise<void> {
    if (isWeb) return globalThis.localStorage?.setItem(key, value);
    await SecureStore.setItemAsync(key, value);
  },
  async remove(key: string): Promise<void> {
    if (isWeb) return globalThis.localStorage?.removeItem(key);
    await SecureStore.deleteItemAsync(key);
  },
};
