import { useQuery } from '@apollo/client/react';
import { router } from 'expo-router';
import { useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GET_MY_PROFILE, type GetMyProfileData } from '@/api/queries';
import { useAuth } from '@/auth/auth-context';
import { Button } from '@/components/button';
import { LogoMark } from '@/components/logo';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { enterUp, enterFade } from '@/constants/motion';
import { Brand, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const ROLE_LABELS = { USER: 'Buyer', AGENT: 'Dealer', ADMIN: 'Admin' } as const;

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <View style={styles.infoRow}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText type="smallBold">{value}</ThemedText>
    </View>
  );
}

/** my account: log in, or my profile and the two ways to log out */
export default function MeScreen() {
  const theme = useTheme();
  const { member, logOut, logOutEverywhere } = useAuth();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  // loaded with my access token: the private fields (phone, full name) prove the token reached the server
  const { data } = useQuery<GetMyProfileData>(GET_MY_PROFILE, {
    variables: { targetId: member?._id ?? '' },
    skip: !member,
  });
  const profile = data?.getMember;

  const endEverywhere = async () => {
    setBusy(true);
    setError('');
    try {
      await logOutEverywhere();
    } catch {
      setError('Could not reach CarZip. You are still logged in on your other devices.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {!member ? (
          <View style={styles.section}>
            <Animated.View entering={enterUp()} style={styles.hero}>
              <Animated.View entering={enterFade(120)}>
                <LogoMark size={64} />
              </Animated.View>
              <Text style={styles.heroTitle}>
                Your <Text style={styles.accent}>CarZip</Text>
              </Text>
              <Text style={styles.heroText}>
                Log in to like cars, follow dealers, book test drives and write in the chat.
              </Text>
            </Animated.View>
            <Animated.View entering={enterUp(150)}>
              <Button title="Log in" onPress={() => router.push('/login')} />
            </Animated.View>
          </View>
        ) : (
          <View style={styles.section}>
            <Animated.View entering={enterUp()} style={styles.hero}>
              <Animated.View entering={enterFade(100)} style={styles.avatar}>
                <Text style={styles.avatarLetter}>{member.memberNick.charAt(0).toUpperCase()}</Text>
              </Animated.View>
              <Text style={styles.heroTitle}>{member.memberNick}</Text>
              <View style={styles.roleChip}>
                <Text style={styles.roleText}>
                  {ROLE_LABELS[member.memberType]}
                  {profile?.agentCompany ? ` · ${profile.agentCompany}` : ''}
                </Text>
              </View>
            </Animated.View>

            {(profile?.memberFullName || profile?.memberPhone) && (
              <Animated.View
                entering={enterUp(120)}
                style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
                <InfoRow label="Name" value={profile.memberFullName} />
                <InfoRow label="Phone" value={profile.memberPhone} />
              </Animated.View>
            )}

            <Animated.View entering={enterUp(200)} style={styles.actions}>
              <Button title="Log out" variant="dark" onPress={() => logOut()} />
              <Button title="Log out on every device" variant="outline" busy={busy} onPress={endEverywhere} />
              {!!error && (
                <ThemedText type="small" themeColor="danger">
                  {error}
                </ThemedText>
              )}
            </Animated.View>
          </View>
        )}
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
    padding: Spacing.three,
    // the web build shows its tab bar on top
    paddingTop: Platform.OS === 'web' ? Spacing.six + Spacing.four : Spacing.three,
  },
  section: {
    gap: Spacing.three,
  },
  hero: {
    backgroundColor: Brand.ink,
    borderRadius: Radius.large,
    padding: Spacing.four,
    gap: Spacing.three,
    alignItems: 'center',
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 900,
    letterSpacing: -0.5,
  },
  heroText: {
    color: '#C9CED6',
    fontSize: 15,
    lineHeight: 21,
    textAlign: 'center',
  },
  accent: {
    color: Brand.yellow,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: Brand.yellow,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Brand.yellow,
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  avatarLetter: {
    color: Brand.ink,
    fontSize: 38,
    fontWeight: 900,
  },
  roleChip: {
    borderRadius: Radius.pill,
    borderWidth: 1.5,
    borderColor: Brand.yellow,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
  },
  roleText: {
    color: Brand.yellow,
    fontSize: 13,
    fontWeight: 800,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  card: {
    borderRadius: Radius.large,
    borderWidth: 1,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  actions: {
    gap: Spacing.two + 4,
  },
});
