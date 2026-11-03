import { createContext, type ReactNode, useContext, useEffect, useRef, useState } from 'react';

import { apolloClient } from '@/api/client';

import * as session from './session';

interface AuthState {
  member: session.AuthMember | null;
  /** the saved login (refresh token) was checked at app start */
  ready: boolean;
  logIn: typeof session.logIn;
  logOut: typeof session.logOut;
  logOutEverywhere: typeof session.logOutEverywhere;
}

const AuthContext = createContext<AuthState | null>(null);

const RESTORE_TIMEOUT = 6000; // ms

export function AuthProvider({ children }: { children: ReactNode }) {
  const [member, setMember] = useState(session.currentMember);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const unsubscribe = session.onMemberChange(setMember);
    // the app must open even when the check hangs (secure storage or network): then it starts as a guest
    const timeout = new Promise<void>((resolve) =>
      setTimeout(() => {
        console.warn('[auth] the saved login check took too long, starting as a guest');
        resolve();
      }, RESTORE_TIMEOUT),
    );
    const restore = session.restoreSession().catch((err) => console.warn('[auth] saved login check failed:', err));
    Promise.race([restore, timeout]).finally(() => setReady(true));
    return unsubscribe;
  }, []);

  // another member (or a guest) now: what was loaded for the previous one must not be shown, so load it again
  const memberId = member?._id ?? null;
  const previousId = useRef(memberId);
  useEffect(() => {
    if (previousId.current === memberId) return;
    previousId.current = memberId;
    apolloClient.resetStore().catch(() => undefined);
  }, [memberId]);

  const value: AuthState = {
    member,
    ready,
    logIn: session.logIn,
    logOut: session.logOut,
    logOutEverywhere: session.logOutEverywhere,
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error('useAuth must be used inside <AuthProvider>');
  return auth;
}
