import { useQuery } from '@apollo/client/react';
import { router } from 'expo-router';
import { useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GET_MY_PROFILE, type GetMyProfileData } from '@/api/queries';
import { useAuth } from '@/auth/auth-context';
import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';

/** my account: log in, or my profile and the two ways to log out */
export default function MeScreen() {
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
            <ThemedText type="subtitle">Your CarZip</ThemedText>
            <ThemedText themeColor="textSecondary">
              Log in to like cars, follow dealers, book test drives and write in the chat.
            </ThemedText>
            <Button title="Log in" onPress={() => router.push('/login')} />
          </View>
        ) : (
          <View style={styles.section}>
            <ThemedText type="subtitle">{member.memberNick}</ThemedText>
            <ThemedText themeColor="textSecondary">
              {member.memberType === 'AGENT' ? 'Dealer' : member.memberType === 'ADMIN' ? 'Admin' : 'Buyer'}
              {profile?.agentCompany ? ` · ${profile.agentCompany}` : ''}
            </ThemedText>
            {profile?.memberFullName && <ThemedText>{profile.memberFullName}</ThemedText>}
            {profile?.memberPhone && <ThemedText themeColor="textSecondary">{profile.memberPhone}</ThemedText>}
            <Button title="Log out" variant="secondary" onPress={() => logOut()} />
            <Button title="Log out on every device" variant="secondary" busy={busy} onPress={endEverywhere} />
            {!!error && (
              <ThemedText type="small" themeColor="danger">
                {error}
              </ThemedText>
            )}
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
    padding: Spacing.four,
    // the web build shows its tab bar on top
    paddingTop: Platform.OS === 'web' ? Spacing.six + Spacing.four : Spacing.four,
  },
  section: {
    gap: Spacing.three,
  },
});
