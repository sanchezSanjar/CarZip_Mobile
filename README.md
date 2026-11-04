# CarZip Mobile

The mobile app of [CarZip](https://www.carzip.kr), the used-car marketplace for Korea: cars from verified dealers, test drives and a live chat. It talks to the same backend as the website ([CarZip](https://github.com/sanchezSanjar/CarZip), NestJS + GraphQL); the website is [CarZip-next](https://github.com/sanchezSanjar/CarZip-next).

**Status:** first version. Login, the car list and the account screen work; car search, the car page and the chat are next.

## Stack

| Part        | Choice                                                                    |
| ----------- | ------------------------------------------------------------------------- |
| App         | Expo SDK 58, React Native 0.88, TypeScript, Expo Router (file-based tabs) |
| Data        | Apollo Client 4 over the CarZip GraphQL API                               |
| Login       | refresh tokens (backend `API.md` §2), refresh token in `expo-secure-store` |
| Images      | `expo-image`                                                              |
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
  app/                 screens (Expo Router)
    _layout.tsx        Apollo, login state, stack
    (tabs)/            Cars, Chat, Me
    login.tsx          login (modal)
  api/                 backend address, Apollo client, GraphQL queries
  auth/                tokens, refresh, device id, login state (useAuth)
  components/          logo, animated button, text field, tabs, themed text and views
  constants/theme.ts   colours from the logo (yellow #F5A623, black #1E242B), spacing
```

## Next steps

- Car search and filters, the car page with photos, like and test-drive request
- Live chat (the public room, plain WebSocket)
- Push notifications and a live unread count
