import type { ImagePickerAsset } from 'expo-image-picker';
import { Platform } from 'react-native';

import { getAccessToken } from '@/auth/session';

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
  if (!token) throw new Error('Log in to send photos.');

  const form = new FormData();
  form.append('target', 'chat');
  if (Platform.OS === 'web' && asset.file) form.append('file', asset.file);
  else {
    // React Native sends a file given as { uri, name, type }
    const file = { uri: asset.uri, name: asset.fileName ?? 'photo.jpg', type: asset.mimeType ?? 'image/jpeg' };
    form.append('file', file as unknown as Blob);
  }

  const response = await fetch(`${API_URL}/upload/image`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const result = await response.json();
  if (!response.ok) throw new Error(Array.isArray(result.message) ? result.message[0] : (result.message ?? 'Upload failed.'));
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
  if (!token) throw new Error('Log in to send voice messages.');

  const form = new FormData();
  if (Platform.OS === 'web') {
    const blob = await (await fetch(uri)).blob();
    form.append('file', blob, 'voice.webm');
  } else {
    form.append('file', { uri, name: 'voice.m4a', type: 'audio/mp4' } as unknown as Blob);
  }

  const response = await fetch(`${API_URL}/upload/voice`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const result = await response.json();
  if (!response.ok) throw new Error(Array.isArray(result.message) ? result.message[0] : (result.message ?? 'Upload failed.'));
  return result.url as string;
}
