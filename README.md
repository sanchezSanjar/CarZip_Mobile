# CarZip Mobile

The mobile app of [CarZip](https://www.carzip.kr), the used-car marketplace for Korea: cars from verified dealers, test drives and a live chat. It talks to the same backend as the website ([CarZip](https://github.com/sanchezSanjar/CarZip), NestJS + GraphQL); the website is [CarZip-next](https://github.com/sanchezSanjar/CarZip-next).

**Status:** working app. Car search, the car page, test drives, the live chat room, private messages with photos and voice, push notifications, four languages and light / dark mode are all in.

## Features

- **Cars:** search by name, brand chips, filters (sort, price, body type, fuel, test drive possible) and a car list with skeleton loading.
- **Car page:** swipeable photos, price, facts, options and description, the dealer with call and KakaoTalk buttons, a like heart, and **test-drive booking** (pick a day and time, add a message).
- **Live chat room:** the public CarZip room over WebSocket, with bubbles, an online count and a live dot; guests can read, members can write (up to 500 characters). It reconnects by itself (1 s, 2 s, 4 s … 30 s) and keeps going after a token refresh.
- **Private messages:** conversations with dealers (dealers can message each other too), a live thread, read receipts (✓ sent, ✓✓ read) and an unread badge on the Chat tab.
  - **Photos** from the camera or the gallery (the server stores them as WebP with a thumbnail and deletes them a day after the message).
  - **Voice messages:** tap the mic button to record (mono AAC, up to 2 minutes), then send or cancel; play them in the bubble.
- **Push notifications:** new private messages and in-app notifications, also when the app is closed; tapping one opens the right screen. No banner for the conversation already on screen.
- **Me:** profile with avatar, language picker, sun / moon button for light and dark mode (remembered on the phone), logout.
- **Feel:** yellow and black from the CarZip logo, one shared fade-and-slide entrance, a shining main button, haptics; the input stays above the keyboard on Android and iOS.

## Stack

| Part        | Choice                                                                    |
| ----------- | ------------------------------------------------------------------------- |
| App         | Expo SDK 58, React Native 0.88, TypeScript, Expo Router (file-based tabs) |
| Data        | Apollo Client 4 over the CarZip GraphQL API                               |
| Login       | refresh tokens (backend `API.md` §2), refresh token in `expo-secure-store` |
| Live        | plain WebSocket for the chat room and private-message events              |
| Media       | `expo-image`, `expo-image-picker` (photos), `expo-audio` (voice)          |
| Push        | `expo-notifications` with Expo push tokens                                |
| Languages   | i18next + `expo-localization`                                             |
| Look        | yellow and black from the CarZip logo; Reanimated springs, a shining main button, haptics |

## Getting started

1. Install the packages:

   ```bash
   npm install
   ```

2. Point the app at a backend: copy `.env.example` to `.env.local` and set `EXPO_PUBLIC_API_URL`.
   - Backend on your PC: use the PC's address in the Wi-Fi (e.g. `http://192.168.0.10:3007`). On a phone, `localhost` is the phone itself.
   - The live API: `https://api.carzip.kr`.

   Without `.env.local` the app uses `http://localhost:3007` (fine for the web build and the emulators on the same PC).

3. Start it:

   ```bash
   npx expo start
   ```

   Then scan the QR code with Expo Go, or press `a` (Android emulator), `i` (iOS simulator, macOS only) or `w` (browser).

4. **Push notifications (optional):** they need an Expo project id. Run `npx eas init` once, which writes it into `app.json`. Without it, and in the browser build or a simulator, the app works but skips push quietly.

## How login works

The app logs in with a **device** (`login(input: { ..., device })`), so the backend gives it two tokens:

- **Access token:** a JWT valid for 15 minutes, kept in memory only. Sent as `Authorization: Bearer …`.
- **Refresh token:** valid for 60 days, kept in the Keychain / Keystore (`expo-secure-store`). It works once: every refresh returns a new pair.

`src/auth/session.ts` does the rest:

- before a request, an access token that is about to expire is refreshed first;
- only one refresh runs at a time and every request waits for it (sending a used refresh token again would end the session: reuse detection);
- if the server still refuses a token (role changed, password changed on another device), the request is refreshed once and sent again;
- a refused refresh logs the phone out; no network keeps the refresh token for the next try;
- at app start the saved refresh token logs the member in again, behind the splash screen.

The device id is made once and kept, so logging in again on the same phone replaces its old session on the server. In the browser build (development only) the tokens are in `localStorage`, because secure storage doesn't exist there.

## Languages

English, Korean, Russian and Uzbek, like the website. The app follows the phone's language until the member picks one on the Me screen (remembered on the phone).

- `src/i18n/app/<language>.json`: the app's own texts. All four files must have the same keys.
- `src/i18n/shared/`: enum labels (brands, fuels, colours …) and the server's error messages, copied from the website. After the website's texts change, run `node scripts/sync-web-texts.mjs` (it reads `../CarZip-next`).

## Project structure

```
src/
  app/                    screens (Expo Router)
    _layout.tsx           Apollo, login state, push, stack
    (tabs)/               Cars, Chat, Me
    car/[id].tsx          the car page and test-drive booking
    community.tsx         the live chat room
    conversation/[id].tsx one private conversation
    login.tsx             login (modal)
  api/                    backend address, Apollo client, GraphQL queries, WebSocket chat, photo and voice upload
  auth/                   tokens, refresh, device id, login state (useAuth)
  components/             car card, filter and test-drive sheets, like button, voice bubble, buttons, fields, tabs
  hooks/                  theme, unread messages, voice recorder
  i18n/                   app texts (en, kr, ru, uz) and texts shared with the website
  notifications/          push registration and opening a notification
  constants/              colours from the logo (yellow #F5A623, black #1E242B), spacing, motion, car labels
```

## Next steps

- Builds for the App Store and Google Play (EAS Build)
