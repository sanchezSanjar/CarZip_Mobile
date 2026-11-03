import { useQuery } from '@apollo/client/react';
import { useEffect } from 'react';

import { onPrivateEvent } from '@/api/chat';
import { GET_UNREAD_MESSAGE_COUNT } from '@/api/queries';
import { useAuth } from '@/auth/auth-context';

/** my unread private messages (the Chat tab badge): reloaded whenever a message or a read receipt comes in */
export function useUnreadMessages(): number {
  const { member } = useAuth();
  const { data, refetch } = useQuery<{ getUnreadMessageCount: number }>(GET_UNREAD_MESSAGE_COUNT, {
    skip: !member,
    fetchPolicy: 'cache-and-network',
  });

  useEffect(() => {
    if (!member) return;
    return onPrivateEvent(() => {
      refetch().catch(() => undefined);
    });
  }, [member, refetch]);

  return member ? (data?.getUnreadMessageCount ?? 0) : 0;
}
