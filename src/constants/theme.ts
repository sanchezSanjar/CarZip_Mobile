/**
 * CarZip colours come from the logo: a yellow square with a black Z (CarZip-next/public/icon.svg).
 * Yellow is the one accent (main buttons, prices, the selected tab); black carries text and hero blocks.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Brand = {
  yellow: '#F5A623',
  yellowLight: '#FFC94D', // the bright edge of the button shine
  ink: '#1E242B', // the Z of the logo
  black: '#0E1116',
} as const;

export const Colors = {
  light: {
    text: '#14181D',
    background: '#FFFBF2',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#FFF0D1',
    textSecondary: '#5F6670',
    border: '#EDE3D0',
    brand: Brand.yellow,
    onBrand: Brand.ink,
    hero: Brand.ink,
    onHero: '#FFFFFF',
    danger: '#D93025',
  },
  dark: {
    text: '#F6F5F2',
    background: Brand.black,
    backgroundElement: '#1A1F26',
    backgroundSelected: '#2B2415',
    textSecondary: '#A3AAB4',
    border: '#2A3039',
    brand: Brand.yellow,
    onBrand: Brand.ink,
    hero: '#1A1F26',
    onHero: '#FFFFFF',
    danger: '#F28B82',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = {
  small: 10,
  medium: 16,
  large: 24,
  pill: 999,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
