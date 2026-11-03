import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

import { Brand } from '@/constants/theme';

/** the CarZip mark: the website's logo (CarZip-next/public/icon.svg), a black Z on a yellow square */
export function LogoMark({ size = 40 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Rect width={64} height={64} rx={15} fill={Brand.yellow} />
      <Path d="M18 17h28v6.5L28.5 41H46v7H18v-6.5L35.5 24H18z" fill={Brand.ink} />
    </Svg>
  );
}

/** mark + "CarZip", the "Zip" in yellow */
export function Logo({ size = 32, color = Brand.ink }: { size?: number; color?: string }) {
  return (
    <View style={styles.row}>
      <LogoMark size={size} />
      <Text style={[styles.word, { color, fontSize: size * 0.7 }]}>
        Car<Text style={styles.zip}>Zip</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  word: {
    fontWeight: 900,
    letterSpacing: -0.5,
  },
  zip: {
    color: Brand.yellow,
  },
});
