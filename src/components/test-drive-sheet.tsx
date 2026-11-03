import { useMutation } from '@apollo/client/react';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { REQUEST_TEST_DRIVE } from '@/api/queries';
import { enterFade } from '@/constants/motion';
import { Brand, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { Button } from './button';
import { Chip } from './chip';
import { PressableScale } from './pressable-scale';
import { TextField } from './text-field';
import { ThemedText } from './themed-text';

const DAYS = 14; // the next two weeks (the backend allows up to 60 days)
const HOURS = [10, 11, 12, 13, 14, 15, 16, 17, 18];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function nextDays(): Date[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Array.from({ length: DAYS }, (_, i) => new Date(today.getTime() + (i + 1) * 24 * 60 * 60 * 1000));
}

/** pick a day and an hour, add a message, send the request to the dealer */
export function TestDriveSheet({ carId, visible, onClose }: { carId: string; visible: boolean; onClose: () => void }) {
  const theme = useTheme();
  const [days] = useState(nextDays);
  const [day, setDay] = useState(0);
  const [hour, setHour] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [requestTestDrive, { loading }] = useMutation(REQUEST_TEST_DRIVE);

  const send = async () => {
    if (hour === null) return setError('Pick a time.');
    const date = new Date(days[day]);
    date.setHours(hour);
    setError('');
    try {
      await requestTestDrive({
        variables: { input: { carId, testDriveDate: date.toISOString(), ...(message.trim() && { testDriveMessage: message.trim() }) } },
      });
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send the request.');
    }
  };

  const close = () => {
    setSent(false);
    setError('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={close}>
      <Pressable style={styles.backdrop} onPress={close} accessibilityLabel="Close" />
      <SafeAreaView edges={['bottom']} style={[styles.sheet, { backgroundColor: theme.background }]}>
        <View style={[styles.handle, { backgroundColor: theme.border }]} />
        {sent ? (
          <View style={styles.done}>
            <Animated.View entering={enterFade()} style={styles.doneCircle}>
              <Text style={styles.doneCheck}>✓</Text>
            </Animated.View>
            <ThemedText type="subtitle">Request sent</ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.center}>
              The dealer will confirm or suggest another time. You will get a notification.
            </ThemedText>
            <Button title="Great" onPress={close} style={styles.full} />
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <ThemedText type="subtitle">Book a test drive</ThemedText>
            <ThemedText type="smallBold" themeColor="textSecondary" style={styles.label}>
              DAY
            </ThemedText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
              {days.map((date, index) => {
                const selected = index === day;
                return (
                  <PressableScale
                    key={date.toISOString()}
                    pressedScale={0.92}
                    onPress={() => setDay(index)}
                    style={[
                      styles.day,
                      selected
                        ? { backgroundColor: Brand.yellow, borderColor: Brand.yellow }
                        : { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                    ]}>
                    <Text style={[styles.weekday, { color: selected ? Brand.ink : theme.textSecondary }]}>
                      {WEEKDAYS[date.getDay()]}
                    </Text>
                    <Text style={[styles.dayNumber, { color: selected ? Brand.ink : theme.text }]}>{date.getDate()}</Text>
                  </PressableScale>
                );
              })}
            </ScrollView>
            <ThemedText type="smallBold" themeColor="textSecondary" style={styles.label}>
              TIME
            </ThemedText>
            <View style={styles.wrap}>
              {HOURS.map((h) => (
                <Chip key={h} label={`${h}:00`} selected={hour === h} onPress={() => setHour(h)} />
              ))}
            </View>
            <TextField
              placeholder="Message to the dealer (optional)"
              value={message}
              onChangeText={setMessage}
              maxLength={300}
              multiline
            />
            {!!error && (
              <ThemedText type="smallBold" themeColor="danger">
                {error}
              </ThemedText>
            )}
            <Button title="Send request" busy={loading} onPress={send} />
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    maxHeight: '90%',
    borderTopLeftRadius: Radius.large,
    borderTopRightRadius: Radius.large,
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 3,
    marginTop: Spacing.two,
  },
  content: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  label: {
    letterSpacing: 1,
  },
  row: {
    gap: Spacing.two,
  },
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  day: {
    width: 58,
    paddingVertical: Spacing.two,
    borderRadius: Radius.medium,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  weekday: {
    fontSize: 12,
    fontWeight: 700,
  },
  dayNumber: {
    fontSize: 20,
    fontWeight: 900,
  },
  done: {
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.five,
  },
  doneCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: Brand.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneCheck: {
    color: Brand.ink,
    fontSize: 44,
    fontWeight: 900,
  },
  center: {
    textAlign: 'center',
  },
  full: {
    alignSelf: 'stretch',
  },
});
