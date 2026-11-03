import { jwtDecode } from 'jwt-decode';

import { ApiError, graphqlRequest } from '@/api/graphql';

import { getDevice } from './device';
import { secureStorage } from './secure-storage';

/**
 * Login with refresh tokens (backend API.md §2):
 * - access token: JWT, 15 minutes, kept in memory only
 * - refresh token: 60 days, kept in secure storage, works ONCE: every refresh returns a new pair
 */

const REFRESH_TOKEN_KEY = 'carzip.refreshToken';
const EXPIRY_MARGIN = 30; // seconds: an access token this close to its end is refreshed before it is sent

export type MemberType = 'USER' | 'AGENT' | 'ADMIN';

/** the logged-in member, from the access token */
export interface AuthMember {
  _id: string;
  memberNick: string;
  memberType: MemberType;
  memberStatus: string;
}

interface AccessClaims extends AuthMember {
  exp: number;
}

interface Tokens {
  accessToken: string;
  refreshToken: string;
}

const LOGIN = `mutation Login($input: LoginInput!) {
  login(input: $input) { accessToken refreshToken }
}`;
const REFRESH_TOKENS = `mutation RefreshTokens($refreshToken: String!) {
  refreshTokens(refreshToken: $refreshToken) { accessToken refreshToken }
}`;
const LOGOUT = `mutation Logout($refreshToken: String!) { logout(refreshToken: $refreshToken) }`;
const LOGOUT_ALL = `mutation LogoutAll { logoutAll }`;

let accessToken: string | null = null;
let hasSession = false; // a refresh token is stored
let refreshing: Promise<string | null> | null = null;
const listeners = new Set<(member: AuthMember | null) => void>();

/** the logged-in member, or null for a guest */
export function currentMember(): AuthMember | null {
  if (!accessToken) return null;
  const { _id, memberNick, memberType, memberStatus } = jwtDecode<AccessClaims>(accessToken);
  return { _id, memberNick, memberType, memberStatus };
}

/** called on login, logout and every refresh; returns the unsubscribe function */
export function onMemberChange(listener: (member: AuthMember | null) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function setAccessToken(token: string | null) {
  accessToken = token;
  const member = currentMember();
  listeners.forEach((listener) => listener(member));
}

async function saveTokens(tokens: Tokens) {
  await secureStorage.set(REFRESH_TOKEN_KEY, tokens.refreshToken);
  hasSession = true;
  setAccessToken(tokens.accessToken);
}

async function clearTokens() {
  await secureStorage.remove(REFRESH_TOKEN_KEY);
  hasSession = false;
  setAccessToken(null);
}

/** app start: a refresh token from last time logs the member in again, without the password */
export async function restoreSession(): Promise<void> {
  hasSession = !!(await secureStorage.get(REFRESH_TOKEN_KEY));
  if (hasSession) await refreshAccessToken();
}

/** nickname or phone, like the website: digits starting with 01 are a phone number */
export async function logIn(nickOrPhone: string, password: string): Promise<void> {
  const phone = nickOrPhone.replace(/-/g, '');
  const input = /^01\d{8,9}$/.test(phone)
    ? { memberPhone: phone, memberPassword: password }
    : { memberNick: nickOrPhone.trim(), memberPassword: password };
  const data = await graphqlRequest<{ login: Tokens }>(LOGIN, { input: { ...input, device: await getDevice() } });
  await saveTokens(data.login);
}

/** this phone only. Logged out here even when the server can't be reached */
export async function logOut(): Promise<void> {
  const refreshToken = await secureStorage.get(REFRESH_TOKEN_KEY);
  await clearTokens();
  if (refreshToken) await graphqlRequest(LOGOUT, { refreshToken }).catch(() => undefined);
}

/** every phone and browser of this member, this one too. Throws when the server can't be reached */
export async function logOutEverywhere(): Promise<void> {
  const token = await getAccessToken();
  if (token) await graphqlRequest(LOGOUT_ALL, {}, token);
  await clearTokens();
}

/** the access token to send: the one in memory while it has time left, otherwise a refreshed one. null = guest */
export async function getAccessToken(): Promise<string | null> {
  if (accessToken && jwtDecode<AccessClaims>(accessToken).exp - EXPIRY_MARGIN > Date.now() / 1000) {
    return accessToken;
  }
  if (!hasSession) return null;
  return refreshAccessToken();
}

/**
 * New tokens for the stored refresh token. Only ONE refresh runs at a time and every caller waits for it:
 * a refresh token works once, and sending it twice looks like a stolen copy, which ends this session.
 */
export function refreshAccessToken(): Promise<string | null> {
  refreshing ??= (async () => {
    const refreshToken = await secureStorage.get(REFRESH_TOKEN_KEY);
    if (!refreshToken) {
      await clearTokens();
      return null;
    }
    try {
      const data = await graphqlRequest<{ refreshTokens: Tokens }>(REFRESH_TOKENS, { refreshToken });
      await saveTokens(data.refreshTokens);
      return data.refreshTokens.accessToken;
    } catch (err) {
      // refused (expired, used, logged out, password changed, blocked): log in again.
      // No network: keep the refresh token and try again with the next request
      if (err instanceof ApiError) await clearTokens();
      return null;
    }
  })().finally(() => {
    refreshing = null;
  });
  return refreshing;
}
