import { File } from 'expo-file-system';
import type { ImagePickerAsset } from 'expo-image-picker';
import { Platform } from 'react-native';

import { getAccessToken } from '@/auth/session';
import i18n from '@/i18n';

import { API_URL } from './config';

export interface UploadedImage {
  url: string;
  thumbnailUrl: string;
}

/**
 * A photo for a private message: POST /upload/image with target chat (backend API.md §8).
 * The server checks it, re-encodes it as WebP and returns the photo and its thumbnail.
 */
export async function uploadChatPhoto(asset: ImagePickerAsset): Promise<UploadedImage> {
  const token = await getAccessToken();
  if (!token) throw new Error(i18n.t('chat.guest'));

  const form = new FormData();
  form.append('target', 'chat');
  if (Platform.OS === 'web' && asset.file) form.append('file', asset.file);
  // expo/fetch (SDK 58) takes a real file, not React Native's old { uri, name, type } object
  else form.append('file', new File(asset.uri) as unknown as Blob, asset.fileName ?? 'photo.jpg');

  const response = await fetch(`${API_URL}/upload/image`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const result = await response.json();
  if (!response.ok) throw new Error(Array.isArray(result.message) ? result.message[0] : (result.message ?? i18n.t('thread.uploadFailed')));
  return result as UploadedImage;
}

/** the small version of an uploaded photo, for the chat bubble */
export const thumbnailOf = (url: string) => url.replace(/\.webp$/, '_thumb.webp');

/**
 * A voice message: POST /upload/voice (backend API.md §17). The phones record .m4a; the browser build
 * records .webm and hands over a blob: address, which is read back into a file here.
 */
export async function uploadVoice(uri: string): Promise<string> {
  const token = await getAccessToken();
  if (!token) throw new Error(i18n.t('chat.guest'));

  const form = new FormData();
  if (Platform.OS === 'web') {
    const blob = await (await fetch(uri)).blob();
    form.append('file', blob, 'voice.webm');
  } else {
    form.append('file', new File(uri) as unknown as Blob, 'voice.m4a'); // expo/fetch takes a real file
  }

  const response = await fetch(`${API_URL}/upload/voice`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const result = await response.json();
  if (!response.ok) throw new Error(Array.isArray(result.message) ? result.message[0] : (result.message ?? i18n.t('thread.uploadFailed')));
  return result.url as string;
}
