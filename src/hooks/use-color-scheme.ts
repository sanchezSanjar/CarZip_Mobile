import { useSyncExternalStore } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';

import { secureStorage } from '@/auth/secure-storage';

/**
 * Light or dark: the member's choice (the sun / moon button), or the phone's setting until they choose.
 * The choice is kept on the phone, so the app opens the same way next time.
 */
export type ThemeChoice = 'light' | 'dark' | 'system';

const THEME_KEY = 'carzip.theme';
let choice: ThemeChoice = 'system';
const listeners = new Set<() => void>();

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export function setThemeChoice(next: ThemeChoice) {
  choice = next;
  listeners.forEach((listener) => listener());
  secureStorage.set(THEME_KEY, next).catch(() => undefined);
}

/** app start: the choice from last time */
export async function loadThemeChoice(): Promise<void> {
  const saved = await secureStorage.get(THEME_KEY).catch(() => null);
  if (saved === 'light' || saved === 'dark') {
    choice = saved;
    listeners.forEach((listener) => listener());
  }
}

export function useColorScheme(): 'light' | 'dark' {
  const system = useSystemColorScheme();
  const current = useSyncExternalStore(subscribe, () => choice, () => choice);
  if (current !== 'system') return current;
  return system === 'dark' ? 'dark' : 'light';
}
