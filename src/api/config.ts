/**
 * The CarZip backend. Set EXPO_PUBLIC_API_URL in .env.local: on a phone, localhost is the phone itself,
 * so use the PC's address in the Wi-Fi (e.g. http://192.168.0.10:3007) or https://api.carzip.kr.
 */
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3007';
export const GRAPHQL_URL = `${API_URL}/graphql`;
// live chat: the same host over WebSocket (http -> ws, https -> wss)
export const WS_URL = API_URL.replace(/^http/, 'ws');
