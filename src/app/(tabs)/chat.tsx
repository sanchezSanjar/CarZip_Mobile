import { useQuery } from '@apollo/client/react';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect } from 'react';
import { FlatList, Platform, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { onPrivateEvent, startChat, useChat } from '@/api/chat';
import { GET_CONVERSATIONS, type ConversationItem } from '@/api/queries';
import { useAuth } from '@/auth/auth-context';
import { Button } from '@/components/button';
import { PressableScale } from '@/components/pressable-scale';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { enterUp } from '@/constants/motion';
import { shortTime } from '@/constants/time';
import { BottomTabInset, Brand, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** the public room, on top of the list */
function CommunityCard() {
  const chat = useChat();
  return (
    <PressableScale onPress={() => router.push('/community')} pressedScale={0.97} style={styles.community}>
      <View style={styles.communityIcon}>
        <Text style={styles.communityIconText}>#</Text>
      </View>
      <View style={styles.flex}>
        <Text style={styles.communityTitle}>
          CarZip <Text style={styles.accent}>community</Text>
        </Text>
        <Text style={styles.communityText}>
          Public chat for everyone · {chat.status === 'open' ? `${chat.online} online` : 'connecting…'}
        </Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </PressableScale>
  );
}

function ConversationRow({ conversation, meId, index }: { conversation: ConversationItem; meId: string; index: number }) {
  const theme = useTheme();
  const partner = conversation.partner;
  const name = partner?.agentCompany || partner?.memberNick || 'Member';
  const unread = conversation.myUnread > 0;
  const mineLast = conversation.lastSenderId === meId;

  return (
    <Animated.View entering={enterUp(Math.min(index, 4) * 40)}>
      <PressableScale
        pressedScale={0.98}
        onPress={() => router.push({ pathname: '/conversation/[id]', params: { id: conversation._id } })}
        style={[styles.row, { backgroundColor: theme.backgroundElement, borderColor: unread ? Brand.yellow : theme.border }]}>
        {partner?.memberImage ? (
          <Image source={partner.memberImage} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarEmpty]}>
            <Text style={styles.avatarLetter}>{name.charAt(0).toUpperCase()}</Text>
          </View>
        )}
        <View style={styles.flex}>
          <View style={styles.rowTop}>
            <ThemedText type="smallBold" numberOfLines={1} style={styles.flex}>
              {name}
              {partner?.memberType === 'AGENT' ? ' · Dealer' : ''}
            </ThemedText>
            <ThemedText type="small" themeColor={unread ? 'text' : 'textSecondary'}>
              {shortTime(conversation.lastMessageAt)}
            </ThemedText>
          </View>
          {conversation.carData && (
            <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
              🚗 {conversation.carData.carTitle}
            </ThemedText>
          )}
          <View style={styles.rowTop}>
            <ThemedText type={unread ? 'smallBold' : 'small'} themeColor={unread ? 'text' : 'textSecondary'} numberOfLines={1} style={styles.flex}>
              {conversation.lastMessageText ? `${mineLast ? 'You: ' : ''}${conversation.lastMessageText}` : 'Say hello 👋'}
            </ThemedText>
            {unread && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{conversation.myUnread > 99 ? '99+' : conversation.myUnread}</Text>
              </View>
            )}
          </View>
        </View>
      </PressableScale>
    </Animated.View>
  );
}

/** Chat tab: the community room and my private conversations with dealers / buyers */
export default function ChatListScreen() {
  const { member } = useAuth();
  const { data, loading, refetch } = useQuery<{ getConversations: { list: ConversationItem[]; total: number } }>(
    GET_CONVERSATIONS,
    { variables: { input: { page: 1, limit: 50 } }, skip: !member, fetchPolicy: 'cache-and-network' },
  );

  useEffect(() => {
    startChat();
  }, []);
  // a new message or a read receipt somewhere: the list (order, last message, unread) is loaded again
  useEffect(() => {
    if (!member) return;
    return onPrivateEvent(() => {
      refetch().catch(() => undefined);
    });
  }, [member, refetch]);
  useFocusEffect(
    useCallback(() => {
      if (member) refetch().catch(() => undefined);
    }, [member, refetch]),
  );

  const conversations = data?.getConversations.list ?? [];

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <FlatList
          data={member ? conversations : []}
          keyExtractor={(conversation) => conversation._id}
          renderItem={({ item, index }) => <ConversationRow conversation={item} meId={member?._id ?? ''} index={index} />}
          contentContainerStyle={styles.list}
          refreshing={loading && !!data}
          onRefresh={member ? () => refetch() : undefined}
          ListHeaderComponent={
            <View style={styles.header}>
              <ThemedText type="subtitle">Messages</ThemedText>
              <CommunityCard />
              {member && conversations.length > 0 && (
                <ThemedText type="smallBold" themeColor="textSecondary" style={styles.label}>
                  CONVERSATIONS
                </ThemedText>
              )}
            </View>
          }
          ListEmptyComponent={
            member ? (
              loading ? undefined : (
                <View style={styles.empty}>
                  <ThemedText themeColor="textSecondary" style={styles.center}>
                    No conversations yet. Open a car and tap “Message dealer” to ask about it.
                  </ThemedText>
                </View>
              )
            ) : (
              <View style={styles.empty}>
                <ThemedText themeColor="textSecondary" style={styles.center}>
                  Log in to message dealers about their cars.
                </ThemedText>
                <Button title="Log in" onPress={() => router.push('/login')} />
              </View>
            )
          }
        />
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
  list: {
    padding: Spacing.three,
    gap: Spacing.two,
    paddingTop: Platform.OS === 'web' ? Spacing.six + Spacing.four : Spacing.three,
    paddingBottom: BottomTabInset + Spacing.three,
  },
  header: {
    gap: Spacing.three,
    marginBottom: Spacing.one,
  },
  label: {
    letterSpacing: 1,
  },
  community: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    backgroundColor: Brand.ink,
    borderRadius: Radius.large,
    padding: Spacing.three,
  },
  communityIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Brand.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  communityIconText: {
    color: Brand.ink,
    fontSize: 22,
    fontWeight: 900,
  },
  communityTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: 900,
  },
  communityText: {
    color: '#C9CED6',
    fontSize: 13,
  },
  accent: {
    color: Brand.yellow,
  },
  chevron: {
    color: Brand.yellow,
    fontSize: 28,
    fontWeight: 700,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.large,
    borderWidth: 1.5,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  avatarEmpty: {
    backgroundColor: Brand.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    color: Brand.ink,
    fontSize: 22,
    fontWeight: 900,
  },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    backgroundColor: Brand.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: Brand.ink,
    fontSize: 12,
    fontWeight: 900,
  },
  empty: {
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.five,
  },
  center: {
    textAlign: 'center',
  },
});
