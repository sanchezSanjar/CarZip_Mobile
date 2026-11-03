import { jwtDecode } from 'jwt-decode';
import { useSyncExternalStore } from 'react';

import { getAccessToken, onMemberChange, peekAccessToken, refreshAccessToken } from '@/auth/session';

import { WS_URL } from './config';
import type { PrivateMessageItem } from './queries';

/**
 * The public CarZip chat room over plain WebSocket (backend API.md §16), and the live events of private messages (§17).
 * - connects with the access token (or as a guest, read only)
 * - after every token refresh it sends { event: "auth" } so the connection keeps going with the new token
 * - login / logout of another member: reconnects as them
 * - a dropped connection comes back by itself, waiting a little longer each time (1 s, 2 s, 4 s ... 30 s)
 */

export interface ChatMember {
  _id: string;
  memberNick: string;
  memberImage?: string;
  memberType: string;
}

export interface ChatMessage {
  text: string;
  memberData: ChatMember | null;
  createdAt: string;
}

export interface ChatState {
  status: 'connecting' | 'open' | 'closed' | 'blocked';
  messages: ChatMessage[];
  online: number;
  error: string;
}

const KEEP = 100; // messages kept on the phone
const CLOSE_UNAUTHORIZED = 4001; // bad / expired token
const CLOSE_FORBIDDEN = 4003; // blocked member
export const MESSAGE_MAX_LENGTH = 500;

/** private-message events from the server (backend API.md §17): only for this member's conversations */
export type PrivateEvent =
  | { event: 'privateMessage'; conversationId: string; message: PrivateMessageItem }
  | { event: 'conversationRead'; conversationId: string; readAt: string };

const privateListeners = new Set<(event: PrivateEvent) => void>();

/** the conversation list, the open thread and the tab badge listen here; returns the unsubscribe function */
export function onPrivateEvent(listener: (event: PrivateEvent) => void): () => void {
  privateListeners.add(listener);
  return () => privateListeners.delete(listener);
}

let state: ChatState = { status: 'closed', messages: [], online: 0, error: '' };
const listeners = new Set<() => void>();
let socket: WebSocket | null = null;
let socketToken: string | null = null; // the token this connection is logged in with
let socketMemberId: string | null = null;
let retries = 0;
let retryTimer: ReturnType<typeof setTimeout> | undefined;
let started = false;

function update(patch: Partial<ChatState>) {
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener());
}

const memberIdOf = (token: string | null) => {
  if (!token) return null;
  try {
    return jwtDecode<{ _id: string }>(token)._id;
  } catch {
    return null;
  }
};

async function open() {
  clearTimeout(retryTimer);
  if (socket) {
    socket.onclose = null; // closing on purpose: no reconnect for this one
    socket.close();
  }
  update({ status: 'connecting', error: '' });
  const token = await getAccessToken(); // a fresh one: refreshed first when it is about to expire
  socketToken = token;
  socketMemberId = memberIdOf(token);
  const ws = new WebSocket(token ? `${WS_URL}?token=${encodeURIComponent(token)}` : WS_URL);
  socket = ws;

  ws.onopen = () => {
    retries = 0;
    update({ status: 'open' });
  };

  ws.onmessage = (event) => {
    let msg: { event?: string; list?: ChatMessage[]; totalClients?: number; message?: string } & Partial<ChatMessage>;
    try {
      msg = JSON.parse(String(event.data));
    } catch {
      return;
    }
    if (msg.event === 'getMessages') update({ messages: (msg.list ?? []).slice(-KEEP) });
    else if (msg.event === 'message' && msg.text) {
      const message = { text: msg.text, memberData: msg.memberData ?? null, createdAt: msg.createdAt ?? new Date().toISOString() };
      update({ messages: [...state.messages, message].slice(-KEEP) });
    } else if (msg.event === 'info') update({ online: msg.totalClients ?? 0 });
    else if (msg.event === 'error') update({ error: msg.message ?? '' });
    else if (msg.event === 'privateMessage' || msg.event === 'conversationRead') {
      privateListeners.forEach((listener) => listener(msg as unknown as PrivateEvent));
    }
  };

  ws.onclose = (event) => {
    if (socket !== ws) return;
    socket = null;
    if (event.code === CLOSE_FORBIDDEN) return update({ status: 'blocked' });
    if (event.code === CLOSE_UNAUTHORIZED && socketToken) {
      // the token was refused (expired, password changed): refresh, then come back (as a guest if that fails)
      refreshAccessToken().finally(open);
      return;
    }
    update({ status: 'closed' });
    retryTimer = setTimeout(open, Math.min(30_000, 1000 * 2 ** retries++));
  };
}

/** start the chat once; later calls do nothing */
export function startChat() {
  if (started) return;
  started = true;
  open();
  // every token change: the same member -> hand the new token over; another member or a guest -> reconnect
  onMemberChange(() => {
    const token = peekAccessToken();
    if (memberIdOf(token) !== socketMemberId) return open();
    if (token && token !== socketToken && socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ event: 'auth', data: token }));
      socketToken = token;
    }
  });
}

/** send one message; false when there is no open connection */
export function sendChat(text: string): boolean {
  if (socket?.readyState !== WebSocket.OPEN) return false;
  update({ error: '' });
  socket.send(JSON.stringify({ event: 'message', data: text }));
  return true;
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export function useChat(): ChatState {
  return useSyncExternalStore(subscribe, () => state, () => state);
}
