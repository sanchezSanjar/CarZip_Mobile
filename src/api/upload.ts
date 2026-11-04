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
