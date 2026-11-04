import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { Brand, Radius, Spacing } from '@/constants/theme';

import { PressableScale } from './pressable-scale';

/** 75 -> "1:15" */
export const formatSeconds = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;

/**
 * A voice message: play / pause, a bar that fills while it plays, and the time.
 * The recording is loaded only when play is pressed, so a long thread doesn't download every voice message.
 */
export function VoiceBubble({ url, duration, mine }: { url: string; duration: number; mine: boolean }) {
  const { t } = useTranslation();
  const player = useAudioPlayer(null);
  const status = useAudioPlayerStatus(player);
  const [loaded, setLoaded] = useState(false);

  // finished: back to the start, ready to play again
  useEffect(() => {
    if (status.didJustFinish) player.seekTo(0).catch(() => undefined);
  }, [status.didJustFinish, player]);

  const toggle = () => {
    if (!loaded) {
      player.replace({ uri: url });
      setLoaded(true);
    }
    if (status.playing) player.pause();
    else player.play();
  };

  const total = status.duration > 0 ? status.duration : duration;
  const progress = total > 0 ? Math.min(1, status.currentTime / total) : 0;
  const ink = mine ? Brand.ink : Brand.yellow;

  return (
    <View style={styles.row}>
      <PressableScale
        onPress={toggle}
        pressedScale={0.88}
        accessibilityRole="button"
        accessibilityLabel={status.playing ? t('thread.pause') : t('thread.play')}
        style={[styles.play, { backgroundColor: mine ? Brand.ink : Brand.yellow }]}>
        <Text style={[styles.playIcon, { color: mine ? Brand.yellow : Brand.ink }]}>{status.playing ? '❚❚' : '▶'}</Text>
      </PressableScale>
      <View style={styles.track}>
        <View style={[styles.trackBack, { backgroundColor: mine ? 'rgba(30,36,43,0.25)' : 'rgba(245,166,35,0.25)' }]} />
        <View style={[styles.trackFill, { width: `${progress * 100}%`, backgroundColor: ink }]} />
      </View>
      <Text style={[styles.time, { color: mine ? Brand.ink : '#A3AAB4' }]}>
        {formatSeconds(status.playing || status.currentTime > 0 ? status.currentTime : duration)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    minWidth: 200,
  },
  play: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    fontSize: 14,
    fontWeight: 900,
  },
  track: {
    flex: 1,
    height: 6,
    justifyContent: 'center',
  },
  trackBack: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 6,
    borderRadius: Radius.pill,
  },
  trackFill: {
    height: 6,
    borderRadius: Radius.pill,
  },
  time: {
    fontSize: 12,
    fontWeight: 700,
    minWidth: 34,
    textAlign: 'right',
  },
});
