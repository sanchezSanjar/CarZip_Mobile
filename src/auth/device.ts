import * as Crypto from 'expo-crypto';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

import { secureStorage } from './secure-storage';

const DEVICE_ID_KEY = 'carzip.deviceId';

export type DevicePlatform = 'IOS' | 'ANDROID' | 'WEB';

/** the device input of login and signup (API.md §2) */
export interface DeviceInput {
  deviceId: string;
  deviceName?: string;
  devicePlatform: DevicePlatform;
}

/**
 * This phone. The id is made once and kept, so logging in again on the same phone replaces its old session
 * on the server instead of adding one more.
 */
export async function getDevice(): Promise<DeviceInput> {
  let deviceId = await secureStorage.get(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = Crypto.randomUUID();
    await secureStorage.set(DEVICE_ID_KEY, deviceId);
  }
  const devicePlatform = Platform.OS === 'ios' ? 'IOS' : Platform.OS === 'android' ? 'ANDROID' : 'WEB';
  return { deviceId, deviceName: Device.modelName || undefined, devicePlatform };
}
