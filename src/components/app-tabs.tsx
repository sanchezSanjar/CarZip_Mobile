import { NativeTabs } from 'expo-router/native-tabs';

import { Brand } from '@/constants/theme';

const UNSELECTED = '#8A919B';

/** a black tab bar with the selected tab in yellow, in light and dark mode (the colours of the logo) */
export default function AppTabs() {
  return (
    <NativeTabs
      backgroundColor={Brand.black}
      indicatorColor="#3A2F17"
      iconColor={{ default: UNSELECTED, selected: Brand.yellow }}
      labelStyle={{ default: { color: UNSELECTED }, selected: { color: Brand.yellow, fontWeight: '700' } }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Cars</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="car.fill" md="directions_car" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="chat">
        <NativeTabs.Trigger.Label>Chat</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="bubble.left.and.bubble.right.fill" md="forum" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="me">
        <NativeTabs.Trigger.Label>Me</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="person.crop.circle.fill" md="account_circle" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
