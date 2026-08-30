# Fish — kids card game

A React + Vite implementation of Fish (Literature / 7-up). Play pass-and-play on
one device, against the computer, or **online with a friend on another device**.

## Develop

```bash
npm install
npm start      # dev server on http://localhost:5173
npm run build  # production build into dist/
npm run lint
```

## Play online with a friend

Online play uses **Firebase Realtime Database** as the sync layer. The player who
creates a room is the referee: their browser runs the game and publishes state;
everyone else sends their moves back through the database.

### 1. Create a Firebase project

1. Go to <https://console.firebase.google.com> and create a project.
2. **Build → Realtime Database → Create database** (start in *test mode*).
3. **Project settings → General → Your apps → Web app** — register one and copy
   the config values.

### 2. Configure the app

Copy `.env.example` to `.env.local` and fill in the values. `VITE_FIREBASE_DATABASE_URL`
is the URL shown on the Realtime Database page — usually
`https://<project-id>-default-rtdb.firebaseio.com`, or a regional
`https://<project-id>-default-rtdb.<region>.firebasedatabase.app`.

When these vars are missing the “🌐 Play online with a friend” button stays disabled;
everything else still works.

### 3. Database rules

Test mode is fine to start. A slightly tighter rule set that still needs no login:

```json
{ "rules": { "rooms": { "$code": { ".read": true, ".write": true } } } }
```

Note: anyone who knows a 4-character room code can read/write that room. That is
acceptable for casual play with a friend. Hands are also filtered in the browser,
not on the server, so a determined player could inspect network traffic to see
other hands — fine for a friendly game, not for anything competitive. Old rooms
are not cleaned up automatically.

### 4. Deploy (Vercel or Netlify)

Import the repo, then:

- **Build command:** `npm run build`  **Output directory:** `dist`
- Add the same `VITE_FIREBASE_*` environment variables in the project settings.

`vercel.json` and `public/_redirects` are included so client-side routes resolve
on refresh.

### 5. Play

1. One player opens the site → **🌐 Play online with a friend → Create a room**,
   picks the player count, marks any computer seats, and gets a 4-character code.
2. The other player opens the same URL → **Join a room**, enters the code, and
   picks a seat.
3. The host clicks **Deal the cards**.

Each player only sees their own hand; when it isn't your turn the board shows
“Waiting for …”. The host must keep their tab open for the game to continue (a
refresh recovers automatically; fully closing the tab ends the game).

## Ads

There's a single slim banner (`src/components/AdBar`) pinned to the bottom of the
screen. It stays out of the way: full-height screens get a matching
`padding-bottom`, and it never covers gameplay.

- Nothing loads until you set `VITE_ADSENSE_CLIENT` and `VITE_ADSENSE_SLOT`
  (see `.env.example`). During `npm start` with no config you get a grey "Ad"
  placeholder so you can see the layout.
- Values come from a Google AdSense account once your deployed site is approved:
  create a **Display** ad unit, then copy the publisher id (`ca-pub-…`) and the
  unit's slot id.
- Add the same two vars in your Vercel / Netlify project settings.
- Heads up: AdSense treats "made for kids" content specially — personalized ads
  are turned off for it and approval can be stricter. Worth checking their
  policy before you lean on it for revenue.

To remove ads entirely, delete the `<AdBar />` line in `src/main.jsx`.
