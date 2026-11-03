import { useMutation, useQuery } from '@apollo/client/react';
import { Image } from 'expo-image';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { onPrivateEvent, startChat } from '@/api/chat';
import { ApiError } from '@/api/graphql';
import {
  GET_CONVERSATIONS,
  GET_MESSAGES,
  MARK_CONVERSATION_READ,
  SEND_MESSAGE,
  type ConversationItem,
  type PrivateMessageItem,
} from '@/api/queries';
import { useAuth } from '@/auth/auth-context';
import { PressableScale } from '@/components/pressable-scale';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { formatPrice } from '@/constants/cars';
import { enterUp } from '@/constants/motion';
import { Brand, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { clock } from '@/constants/time';
import { useTheme } from '@/hooks/use-theme';

const PAGE = 30;
const MAX_LENGTH = 1000;

function Bubble({ message, mine, read }: { message: PrivateMessageItem; mine: boolean; read: boolean }) {
  const theme = useTheme();
  return (
    <Animated.View entering={enterUp()} style={[styles.bubbleRow, mine && styles.bubbleRowMine]}>
      <View
        style={[
          styles.bubble,
          mine
            ? { backgroundColor: Brand.yellow, borderBottomRightRadius: 4 }
            : { backgroundColor: theme.backgroundElement, borderColor: theme.border, borderWidth: 1, borderBottomLeftRadius: 4 },
        ]}>
        {message.carData && (
          <PressableScale
            onPress={() => router.push({ pathname: '/car/[id]', params: { id: message.carData!._id } })}
            style={styles.carCard}>
            {message.carData.carImages[0] && <Image source={message.carData.carImages[0]} style={styles.carThumb} />}
            <View style={styles.flex}>
              <Text numberOfLines={1} style={styles.carTitle}>
                {message.carData.carTitle}
              </Text>
              <Text style={styles.carPrice}>{formatPrice(message.carData)}</Text>
            </View>
          </PressableScale>
        )}
        {!!message.messageText && (
          <Text style={[styles.text, { color: mine ? Brand.ink : theme.text }]}>{message.messageText}</Text>
        )}
        <View style={styles.meta}>
          <Text style={[styles.time, { color: mine ? 'rgba(30,36,43,0.6)' : theme.textSecondary }]}>
            {clock(message.createdAt)}
          </Text>
          {/* ✓ sent, ✓✓ read by the other side */}
          {mine && <Text style={[styles.ticks, read && styles.ticksRead]}>{read ? '✓✓' : '✓'}</Text>}
        </View>
      </View>
    </Animated.View>
  );
}

/** one private conversation: the thread, newest at the bottom, live */
export default function ConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const { member } = useAuth();
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [older, setOlder] = useState<PrivateMessageItem[]>([]);
  const [live, setLive] = useState<PrivateMessageItem[]>([]);
  const [partnerReadAt, setPartnerReadAt] = useState<string | null>(null);
  const [noMore, setNoMore] = useState(false);

  // the conversation itself (partner, car) comes from the list, which is usually in the cache already
  const { data: listData } = useQuery<{ getConversations: { list: ConversationItem[] } }>(GET_CONVERSATIONS, {
    variables: { input: { page: 1, limit: 50 } },
    skip: !member,
  });
  const conversation = listData?.getConversations.list.find((item) => item._id === id);
  const { data, loading, fetchMore } = useQuery<{ getMessages: PrivateMessageItem[] }>(GET_MESSAGES, {
    variables: { input: { conversationId: id, limit: PAGE } },
    fetchPolicy: 'network-only',
    skip: !member,
  });
  const [sendMessage, { loading: sending }] = useMutation<{ sendMessage: PrivateMessageItem }>(SEND_MESSAGE);
  const [markRead] = useMutation(MARK_CONVERSATION_READ);

  // newest first, without doubles (a sent message also comes back live)
  const seen = new Set<string>();
  const messages = [...live, ...(data?.getMessages ?? []), ...older].filter((message) => {
    if (seen.has(message._id)) return false;
    seen.add(message._id);
    return true;
  });
  const readAt = partnerReadAt ?? conversation?.partnerReadAt ?? null;

  useEffect(() => {
    if (!member || !id) return;
    startChat();
    markRead({ variables: { conversationId: id } }).catch(() => undefined);
    // new messages in this conversation appear at once; the other side reading it turns ✓ into ✓✓
    return onPrivateEvent((event) => {
      if (event.conversationId !== id) return;
      if (event.event === 'privateMessage') {
        setLive((list) => [event.message, ...list]);
        if (event.message.senderId !== member._id) markRead({ variables: { conversationId: id } }).catch(() => undefined);
      } else setPartnerReadAt(event.readAt);
    });
  }, [id, member, markRead]);

  const loadOlder = async () => {
    const oldest = messages[messages.length - 1];
    if (!oldest || noMore || loading) return;
    const result = await fetchMore({ variables: { input: { conversationId: id, limit: PAGE, before: oldest.createdAt } } });
    const page = result.data?.getMessages ?? [];
    if (page.length < PAGE) setNoMore(true);
    setOlder((list) => [...list, ...page]);
  };

  const send = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setError('');
    try {
      const result = await sendMessage({ variables: { input: { conversationId: id, messageText: trimmed } } });
      if (result.data) setLive((list) => [result.data!.sendMessage, ...list]);
      setText('');
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : 'Could not send the message.');
    }
  };

  const partner = conversation?.partner;
  const name = partner?.agentCompany || partner?.memberNick || 'Conversation';

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: name }} />
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        {conversation?.carData && (
          <PressableScale
            onPress={() => router.push({ pathname: '/car/[id]', params: { id: conversation.carData!._id } })}
            style={styles.topCar}>
            {conversation.carData.carImages[0] && <Image source={conversation.carData.carImages[0]} style={styles.topCarThumb} />}
            <View style={styles.flex}>
              <Text numberOfLines={1} style={styles.topCarTitle}>
                {conversation.carData.carTitle}
              </Text>
              <Text style={styles.carPrice}>{formatPrice(conversation.carData)}</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </PressableScale>
        )}

        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
          <FlatList
            inverted
            data={messages}
            keyExtractor={(message) => message._id}
            renderItem={({ item }) => (
              <Bubble
                message={item}
                mine={item.senderId === member?._id}
                read={!!readAt && Date.parse(item.createdAt) <= Date.parse(readAt)}
              />
            )}
            onEndReached={loadOlder}
            onEndReachedThreshold={0.3}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              loading ? undefined : (
                <View style={styles.empty}>
                  <ThemedText themeColor="textSecondary" style={styles.center}>
                    Say hello! Ask about the car, the price or a test drive. Messages are kept for 14 days.
                  </ThemedText>
                </View>
              )
            }
          />

          {!!error && (
            <ThemedText type="smallBold" themeColor="danger" style={styles.error}>
              {error}
            </ThemedText>
          )}
          <View style={[styles.inputBar, { backgroundColor: theme.background, borderColor: theme.border }]}>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Write a message…"
              placeholderTextColor={theme.textSecondary}
              maxLength={MAX_LENGTH}
              multiline
              style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
            />
            <PressableScale
              onPress={send}
              disabled={!text.trim() || sending}
              accessibilityLabel="Send"
              style={[styles.send, (!text.trim() || sending) && styles.sendOff]}>
              <Text style={styles.sendIcon}>➤</Text>
            </PressableScale>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

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
  topCar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    margin: Spacing.three,
    marginBottom: 0,
    padding: Spacing.two,
    borderRadius: Radius.medium,
    backgroundColor: Brand.ink,
  },
  topCarThumb: {
    width: 56,
    height: 42,
    borderRadius: Radius.small,
  },
  topCarTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 800,
  },
  chevron: {
    color: Brand.yellow,
    fontSize: 26,
    fontWeight: 700,
    paddingRight: Spacing.two,
  },
  list: {
    padding: Spacing.three,
    gap: Spacing.two,
  },
  empty: {
    paddingVertical: Spacing.five,
    paddingHorizontal: Spacing.four,
    transform: [{ scaleY: -1 }], // the list is upside down
  },
  center: {
    textAlign: 'center',
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
    gap: 4,
  },
  carCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.one + 2,
    borderRadius: Radius.small,
    backgroundColor: Brand.ink,
    minWidth: 200,
  },
  carThumb: {
    width: 48,
    height: 36,
    borderRadius: 6,
  },
  carTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 800,
  },
  carPrice: {
    color: Brand.yellow,
    fontSize: 13,
    fontWeight: 900,
  },
  text: {
    fontSize: 15,
    lineHeight: 21,
  },
  meta: {
    flexDirection: 'row',
    alignSelf: 'flex-end',
    alignItems: 'center',
    gap: 4,
  },
  time: {
    fontSize: 11,
  },
  ticks: {
    fontSize: 11,
    fontWeight: 900,
    color: 'rgba(30,36,43,0.55)',
  },
  ticksRead: {
    color: Brand.ink,
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
