import { useMutation, useQuery } from '@apollo/client/react';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { onPrivateEvent, startChat } from '@/api/chat';
import { ApiError } from '@/api/graphql';
import { translateServerMessage } from '@/i18n';
import { thumbnailOf, uploadChatPhoto, uploadVoice, type UploadedImage } from '@/api/upload';
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
import { formatSeconds, VoiceBubble } from '@/components/voice-bubble';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { formatPrice } from '@/constants/cars';
import { enterUp } from '@/constants/motion';
import { Brand, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { clock } from '@/constants/time';
import { useTheme } from '@/hooks/use-theme';
import { setOpenConversation } from '@/notifications/push';
import { MAX_VOICE_SECONDS, useVoiceRecorder } from '@/hooks/use-voice-recorder';

const PAGE = 30;
const MAX_LENGTH = 1000;

function Bubble({
  message,
  mine,
  read,
  onOpenPhoto,
}: {
  message: PrivateMessageItem;
  mine: boolean;
  read: boolean;
  onOpenPhoto: (url: string) => void;
}) {
  const { t } = useTranslation();
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
        {!!message.messageImage && (
          <PressableScale onPress={() => onOpenPhoto(message.messageImage!)} accessibilityLabel={t('thread.openPhoto')}>
            <Image source={thumbnailOf(message.messageImage)} style={styles.photo} contentFit="cover" transition={200} />
          </PressableScale>
        )}
        {!!message.messageAudio && (
          <VoiceBubble url={message.messageAudio} duration={message.messageDuration ?? 0} mine={mine} />
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

/** the red dot while recording: it fades in and out */
function RecordingDot() {
  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.set(withRepeat(withTiming(0.25, { duration: 600 }), -1, true));
  }, [pulse]);
  const style = useAnimatedStyle(() => ({ opacity: pulse.get() }));
  return <Animated.View style={[styles.recordDot, style]} />;
}

/** one private conversation: the thread, newest at the bottom, live */
export default function ConversationScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const { member } = useAuth();
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [older, setOlder] = useState<PrivateMessageItem[]>([]);
  const [live, setLive] = useState<PrivateMessageItem[]>([]);
  const [partnerReadAt, setPartnerReadAt] = useState<string | null>(null);
  const [noMore, setNoMore] = useState(false);
  const [photo, setPhoto] = useState<(UploadedImage & { localUri: string }) | null>(null); // uploaded, waiting to be sent
  const [uploading, setUploading] = useState(false);
  const [viewing, setViewing] = useState<string | null>(null); // the photo open full screen

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

  // while this thread is open, its new messages show here instead of as a banner
  useEffect(() => {
    setOpenConversation(id ?? null);
    return () => setOpenConversation(null);
  }, [id]);

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

  // the photo is uploaded right away; it goes out with the next Send, with the text as its caption
  const pickPhoto = async (fromCamera: boolean) => {
    const permission = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return setError(fromCamera ? t('thread.allowCamera') : t('thread.allowPhotos'));
    const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.8 };
    const picked = fromCamera ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
    const asset = picked.canceled ? undefined : picked.assets[0];
    if (!asset) return;
    setError('');
    setUploading(true);
    try {
      const uploaded = await uploadChatPhoto(asset);
      setPhoto({ ...uploaded, localUri: asset.uri });
    } catch (err) {
      setError(err instanceof Error ? translateServerMessage(err.message) : t('thread.uploadFailed'));
    } finally {
      setUploading(false);
    }
  };
  const attach = () => {
    if (Platform.OS === 'web') return pickPhoto(false); // no camera in the browser build
    Alert.alert(t('thread.sendPhoto'), undefined, [
      { text: t('thread.takePhoto'), onPress: () => pickPhoto(true) },
      { text: t('thread.gallery'), onPress: () => pickPhoto(false) },
      { text: t('common.cancel'), style: 'cancel' },
    ]);
  };

  // a voice message: recorded, uploaded, sent at once (WhatsApp-like: the mic shows while the input is empty)
  const voice = useVoiceRecorder(async (uri, seconds) => {
    setError('');
    setUploading(true);
    try {
      const audio = await uploadVoice(uri);
      const result = await sendMessage({
        variables: { input: { conversationId: id, messageAudio: audio, messageDuration: seconds } },
      });
      if (result.data) setLive((list) => [result.data!.sendMessage, ...list]);
    } catch (err) {
      setError(err instanceof Error ? translateServerMessage(err.message) : t('thread.voiceFailed'));
    } finally {
      setUploading(false);
    }
  });
  const startVoice = async () => {
    setError('');
    try {
      if (!(await voice.start())) setError(t('thread.allowMic'));
    } catch {
      setError(t('thread.recordFailed'));
    }
  };

  const canSend = (!!text.trim() || !!photo) && !sending && !uploading;
  const showMic = !text.trim() && !photo;
  const send = async () => {
    const trimmed = text.trim();
    if (!canSend) return;
    setError('');
    try {
      const result = await sendMessage({
        variables: {
          input: { conversationId: id, ...(trimmed && { messageText: trimmed }), ...(photo && { messageImage: photo.url }) },
        },
      });
      if (result.data) setLive((list) => [result.data!.sendMessage, ...list]);
      setText('');
      setPhoto(null);
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? translateServerMessage(err.message) : t('thread.sendFailed'));
    }
  };

  const partner = conversation?.partner;
  const name = partner?.agentCompany || partner?.memberNick || t('thread.conversation');

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
                onOpenPhoto={setViewing}
              />
            )}
            onEndReached={loadOlder}
            onEndReachedThreshold={0.3}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              loading ? undefined : (
                <View style={styles.empty}>
                  <ThemedText themeColor="textSecondary" style={styles.center}>
                    {t('thread.empty')}
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
          {(photo || uploading) && (
            <View style={[styles.preview, { borderColor: theme.border }]}>
              {photo ? <Image source={photo.localUri} style={styles.previewImage} /> : <View style={styles.previewImage} />}
              {uploading ? (
                <ActivityIndicator color={Brand.yellow} />
              ) : (
                <ThemedText type="small" themeColor="textSecondary" style={styles.flex}>
                  {t('thread.photoReady')}
                </ThemedText>
              )}
              {photo && (
                <PressableScale onPress={() => setPhoto(null)} accessibilityLabel={t('thread.removePhoto')} style={styles.previewRemove}>
                  <Text style={styles.previewRemoveText}>✕</Text>
                </PressableScale>
              )}
            </View>
          )}
          {voice.recording ? (
            <View style={[styles.inputBar, { backgroundColor: theme.background, borderColor: theme.border }]}>
              <PressableScale onPress={voice.cancel} accessibilityLabel={t('thread.cancelRecording')} style={styles.recordCancel}>
                <Text style={styles.recordCancelText}>✕</Text>
              </PressableScale>
              <View style={[styles.recordBar, { backgroundColor: theme.backgroundElement, borderColor: Brand.yellow }]}>
                <RecordingDot />
                <ThemedText type="smallBold">{formatSeconds(voice.seconds)}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={styles.flex}>
                  {t('thread.recording', { max: formatSeconds(MAX_VOICE_SECONDS) })}
                </ThemedText>
              </View>
              <PressableScale onPress={voice.finish} accessibilityLabel={t('thread.sendVoice')} style={styles.send}>
                <Text style={styles.sendIcon}>➤</Text>
              </PressableScale>
            </View>
          ) : (
          <View style={[styles.inputBar, { backgroundColor: theme.background, borderColor: theme.border }]}>
            <PressableScale
              onPress={attach}
              disabled={uploading}
              accessibilityLabel={t('thread.sendPhoto')}
              style={[styles.attach, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
              <Text style={[styles.attachIcon, { color: theme.text }]}>📷</Text>
            </PressableScale>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder={photo ? t('thread.caption') : t('thread.placeholder')}
              placeholderTextColor={theme.textSecondary}
              maxLength={MAX_LENGTH}
              multiline
              style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
            />
            {showMic ? (
              <PressableScale
                onPress={startVoice}
                disabled={uploading}
                accessibilityLabel={t('thread.record')}
                style={[styles.send, uploading && styles.sendOff]}>
                {uploading ? <ActivityIndicator color={Brand.ink} /> : <Text style={styles.sendIcon}>🎤</Text>}
              </PressableScale>
            ) : (
              <PressableScale
                onPress={send}
                disabled={!canSend}
                accessibilityLabel={t('thread.send')}
                style={[styles.send, !canSend && styles.sendOff]}>
                <Text style={styles.sendIcon}>➤</Text>
              </PressableScale>
            )}
          </View>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* a photo full screen, tap anywhere to close */}
      <Modal visible={!!viewing} transparent animationType="fade" onRequestClose={() => setViewing(null)}>
        <Pressable style={styles.viewer} onPress={() => setViewing(null)} accessibilityLabel={t('thread.closePhoto')}>
          {viewing && <Image source={viewing} style={styles.viewerImage} contentFit="contain" transition={200} />}
          <Text style={styles.viewerClose}>✕</Text>
        </Pressable>
      </Modal>
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
  photo: {
    width: 220,
    height: 165,
    borderRadius: Radius.small,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  preview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    marginHorizontal: Spacing.three,
    marginBottom: Spacing.two,
    padding: Spacing.two,
    borderWidth: 1.5,
    borderRadius: Radius.medium,
  },
  previewImage: {
    width: 56,
    height: 56,
    borderRadius: Radius.small,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  previewRemove: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Brand.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewRemoveText: {
    color: Brand.yellow,
    fontSize: 14,
    fontWeight: 900,
  },
  recordCancel: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Brand.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordCancelText: {
    color: Brand.yellow,
    fontSize: 16,
    fontWeight: 900,
  },
  recordBar: {
    flex: 1,
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderWidth: 1.5,
    borderRadius: Radius.large,
  },
  recordDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E5484D',
  },
  attach: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachIcon: {
    fontSize: 20,
  },
  viewer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewerImage: {
    width: '100%',
    height: '80%',
  },
  viewerClose: {
    position: 'absolute',
    top: 56,
    right: 24,
    color: Brand.yellow,
    fontSize: 26,
    fontWeight: 900,
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
