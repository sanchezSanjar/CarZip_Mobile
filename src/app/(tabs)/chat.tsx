import { useEffect } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedView } from '@/components/themed-view';
import { Brand, MaxContentWidth, Radius, Spacing } from '@/constants/theme';

/** a yellow "live" dot with a ring that keeps growing out of it */
function LiveDot() {
  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.set(withRepeat(withTiming(1, { duration: 1400, easing: Easing.out(Easing.quad) }), -1));
  }, [pulse]);
  const ringStyle = useAnimatedStyle(() => ({
    opacity: 0.7 * (1 - pulse.get()),
    transform: [{ scale: 1 + pulse.get() * 1.6 }],
  }));

  return (
    <View style={styles.dotBox}>
      <Animated.View style={[styles.dot, styles.ring, ringStyle]} />
      <View style={styles.dot} />
    </View>
  );
}

/** the public CarZip chat room (backend API.md §16): comes in the next step */
export default function ChatScreen() {
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <Animated.View entering={FadeInDown.springify().damping(16)} style={styles.hero}>
          <View style={styles.liveRow}>
            <LiveDot />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
          <Text style={styles.title}>
            CarZip <Text style={styles.accent}>chat</Text>
          </Text>
          <Text style={styles.text}>Talk with buyers and dealers in real time. Coming very soon.</Text>
        </Animated.View>
      </SafeAreaView>
    </ThemedView>
  );
}

const DOT = 12;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  safeArea: {
    flex: 1,
    maxWidth: MaxContentWidth,
    padding: Spacing.three,
    paddingTop: Platform.OS === 'web' ? Spacing.six + Spacing.four : Spacing.three,
  },
  hero: {
    backgroundColor: Brand.ink,
    borderRadius: Radius.large,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  liveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  liveText: {
    color: Brand.yellow,
    fontSize: 13,
    fontWeight: 900,
    letterSpacing: 2,
  },
  dotBox: {
    width: DOT,
    height: DOT,
  },
  dot: {
    position: 'absolute',
    width: DOT,
    height: DOT,
    borderRadius: DOT / 2,
    backgroundColor: Brand.yellow,
  },
  ring: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: Brand.yellow,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: 900,
    letterSpacing: -1,
  },
  accent: {
    color: Brand.yellow,
  },
  text: {
    color: '#C9CED6',
    fontSize: 15,
    lineHeight: 21,
  },
});
