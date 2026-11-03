import { Tabs, TabList, TabTrigger, TabSlot, TabTriggerSlotProps, TabListProps } from 'expo-router/ui';
import { View, StyleSheet, Text } from 'react-native';

import { Brand, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useUnreadMessages } from '@/hooks/use-unread-messages';

import { LogoMark } from './logo';
import { PressableScale } from './pressable-scale';

/** the browser build (for development): the same three tabs as a black bar on top */
export default function AppTabs() {
  const unread = useUnreadMessages();
  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="index" href="/" asChild>
            <TabButton>Cars</TabButton>
          </TabTrigger>
          <TabTrigger name="chat" href="/chat" asChild>
            <TabButton>{unread ? `Chat · ${unread}` : 'Chat'}</TabButton>
          </TabTrigger>
          <TabTrigger name="me" href="/me" asChild>
            <TabButton>Me</TabButton>
          </TabTrigger>
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

export function TabButton({ children, isFocused, onPress, onLongPress }: TabTriggerSlotProps) {
  return (
    <PressableScale
      onPress={onPress}
      onLongPress={onLongPress}
      style={[styles.tabButton, isFocused && styles.tabButtonFocused]}>
      <Text style={[styles.tabLabel, isFocused && styles.tabLabelFocused]}>{children}</Text>
    </PressableScale>
  );
}

export function CustomTabList(props: TabListProps) {
  return (
    <View {...props} style={styles.tabListContainer}>
      <View style={styles.innerContainer}>
        <View style={styles.brand}>
          <LogoMark size={26} />
        </View>
        {props.children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabListContainer: {
    position: 'absolute',
    width: '100%',
    padding: Spacing.three,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    zIndex: 10,
  },
  innerContainer: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.pill,
    backgroundColor: Brand.black,
    flexDirection: 'row',
    alignItems: 'center',
    flexGrow: 1,
    gap: Spacing.two,
    maxWidth: MaxContentWidth,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
  },
  brand: {
    marginRight: 'auto',
  },
  tabButton: {
    paddingVertical: Spacing.one + 2,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.pill,
  },
  tabButtonFocused: {
    backgroundColor: Brand.yellow,
  },
  tabLabel: {
    color: '#A3AAB4',
    fontSize: 14,
    fontWeight: 700,
  },
  tabLabelFocused: {
    color: Brand.ink,
  },
});
