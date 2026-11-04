import { clearLastNotificationResponse, useLastNotificationResponse } from 'expo-notifications';
import { useEffect } from 'react';

import { openFromNotification } from './push';

/** a tapped notification (also the one that opened the app) opens the conversation or the car */
export function useNotificationTap(ready: boolean) {
  const lastResponse = useLastNotificationResponse();
  useEffect(() => {
    if (!ready || !lastResponse) return;
    openFromNotification(lastResponse.notification.request.content.data);
    clearLastNotificationResponse(); // opened once, not again on the next render
  }, [ready, lastResponse]);
}
