import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MESSAGE_MAX_LENGTH, sendChat, startChat, useChat, type ChatMessage } from '@/api/chat';
import { useAuth } from '@/auth/auth-context';
import { Button } from '@/components/button';
import { PressableScale } from '@/components/pressable-scale';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { enterUp } from '@/constants/motion';
import { Brand, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** a yellow "live" dot with a ring that keeps growing out of it; grey while not connected */
function LiveDot({ live }: { live: boolean }) {
  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.set(withRepeat(withTiming(1, { duration: 1400, easing: Easing.out(Easing.quad) }), -1));
  }, [pulse]);
  const ringStyle = useAnimatedStyle(() => ({
    opacity: 0.7 * (1 - pulse.get()),
    transform: [{ scale: 1 + pulse.get() * 1.6 }],
  }));
  const color = live ? Brand.yellow : '#6B727C';

  return (
    <View style={styles.dotBox}>
      {live && <Animated.View style={[styles.dot, styles.ring, { borderColor: color }, ringStyle]} />}
      <View style={[styles.dot, { backgroundColor: color }]} />
    </View>
  );
}

const timeOf = (iso: string) => {
  const date = new Date(iso);
  return `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
};

function Bubble({ message, mine }: { message: ChatMessage; mine: boolean }) {
  const theme = useTheme();
  const nick = message.memberData?.memberNick ?? 'Guest';
  const dealer = message.memberData?.memberType === 'AGENT';
  return (
    <Animated.View entering={enterUp()} style={[styles.bubbleRow, mine && styles.bubbleRowMine]}>
      <View
        style={[
          styles.bubble,
          mine
            ? { backgroundColor: Brand.yellow, borderBottomRightRadius: 4 }
            : { backgroundColor: theme.backgroundElement, borderColor: theme.border, borderWidth: 1, borderBottomLeftRadius: 4 },
        ]}>
        {!mine && (
          <Text style={[styles.nick, { color: dealer ? Brand.yellow : theme.textSecondary }]}>
            {nick}
            {dealer ? ' · Dealer' : ''}
          </Text>
        )}
        <Text style={[styles.text, { color: mine ? Brand.ink : theme.text }]}>{message.text}</Text>
        <Text style={[styles.time, { color: mine ? 'rgba(30,36,43,0.6)' : theme.textSecondary }]}>
          {timeOf(message.createdAt)}
        </Text>
      </View>
    </Animated.View>
  );
}

/** Community: the public CarZip chat room (messages of 7 days). Everyone reads, members write */
export default function CommunityScreen() {
  const theme = useTheme();
  const { member } = useAuth();
  const chat = useChat();
  const [text, setText] = useState('');

  useEffect(() => {
    startChat();
  }, []);

  const send = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (sendChat(trimmed)) setText('');
  };

  const live = chat.status === 'open';
  const statusText =
    chat.status === 'open'
      ? `${chat.online} online`
      : chat.status === 'blocked'
        ? 'Your account is blocked'
        : 'Connecting…';

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <Animated.View entering={enterUp()} style={styles.header}>
          <View style={styles.liveRow}>
            <LiveDot live={live} />
            <Text style={styles.liveText}>{live ? 'LIVE' : 'OFFLINE'}</Text>
            <Text style={styles.online}>{statusText}</Text>
          </View>
          <Text style={styles.title}>
            CarZip <Text style={styles.accent}>community</Text>
          </Text>
        </Animated.View>

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
          <FlatList
            // newest at the bottom, like every chat: the list is drawn upside down
            inverted
            data={[...chat.messages].reverse()}
            keyExtractor={(message, index) => `${message.createdAt}-${index}`}
            renderItem={({ item }) => <Bubble message={item} mine={!!member && item.memberData?._id === member._id} />}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <View style={styles.empty}>
                <ThemedText themeColor="textSecondary">No messages in the last 7 days. Say hello!</ThemedText>
              </View>
            }
          />

          {!!chat.error && (
            <ThemedText type="smallBold" themeColor="danger" style={styles.error}>
              {chat.error}
            </ThemedText>
          )}

          <View style={[styles.inputBar, { backgroundColor: theme.background, borderColor: theme.border }]}>
            {member ? (
              <>
                <TextInput
                  value={text}
                  onChangeText={setText}
                  placeholder={live ? 'Write a message…' : 'Connecting…'}
                  placeholderTextColor={theme.textSecondary}
                  maxLength={MESSAGE_MAX_LENGTH}
                  multiline
                  editable={chat.status !== 'blocked'}
                  style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
                />
                <PressableScale
                  onPress={send}
                  disabled={!live || !text.trim()}
                  accessibilityLabel="Send"
                  style={[styles.send, (!live || !text.trim()) && styles.sendOff]}>
                  <Text style={styles.sendIcon}>➤</Text>
                </PressableScale>
              </>
            ) : (
              <Button title="Log in to write" style={styles.flex} onPress={() => router.push('/login')} />
            )}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const DOT = 10;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  safeArea: {
    flex: 1,
    maxWidth: MaxContentWidth,
  },
  flex: {
    flex: 1,
  },
  header: {
    backgroundColor: Brand.ink,
    borderRadius: Radius.large,
    marginHorizontal: Spacing.three,
    marginTop: Spacing.two,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  liveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  liveText: {
    color: Brand.yellow,
    fontSize: 12,
    fontWeight: 900,
    letterSpacing: 2,
  },
  online: {
    color: '#C9CED6',
    fontSize: 13,
    marginLeft: 'auto',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 900,
    letterSpacing: -0.5,
  },
  accent: {
    color: Brand.yellow,
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
  },
  ring: {
    backgroundColor: 'transparent',
    borderWidth: 2,
  },
  list: {
    padding: Spacing.three,
    gap: Spacing.two,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: Spacing.five,
    // the list is upside down
    transform: [{ scaleY: -1 }],
  },
  bubbleRow: {
    flexDirection: 'row',
  },
  bubbleRowMine: {
    justifyContent: 'flex-end',
  },
  bubble: {
    maxWidth: '80%',
    borderRadius: Radius.medium,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    gap: 2,
  },
  nick: {
    fontSize: 12,
    fontWeight: 800,
  },
  text: {
    fontSize: 15,
    lineHeight: 21,
  },
  time: {
    fontSize: 11,
    alignSelf: 'flex-end',
  },
  error: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.one,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.two,
    padding: Spacing.three,
    paddingBottom: Spacing.three,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    minHeight: 46,
    maxHeight: 120,
    borderWidth: 1.5,
    borderRadius: Radius.large,
    paddingHorizontal: Spacing.three,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 15,
  },
  send: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Brand.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendOff: {
    opacity: 0.45,
  },
  sendIcon: {
    color: Brand.ink,
    fontSize: 20,
    fontWeight: 900,
  },
});
