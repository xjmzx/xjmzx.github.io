# GitFolio — GitHub × Nostr Portfolio Generator

Live at **[xjmzx.github.io](https://xjmzx.github.io)**

Enter a GitHub username **or** a Nostr `npub` to instantly generate a shareable developer portfolio. When an npub is supplied the app queries Nostr relays for the user's profile metadata and extracts the linked GitHub account via NIP-39 (External Identities), falling back to `website` / `about` fields for users who haven't yet published an identity claim.

---

## Stack

| Layer | Technology |
|---|---|
| Framework | SvelteKit (Svelte 5 runes) |
| Styling | Tailwind CSS v4 |
| Hosting | GitHub Pages (static) |
| CI / Deploy | GitHub Actions — `.github/workflows/deploy.yml` |
| GitHub data | GitHub REST API (unauthenticated, client-side) |
| Nostr | Raw WebSocket `REQ` / `EVENT` — see `src/lib/nostr.ts` |

### Key source files

```
src/
├── lib/
│   └── nostr.ts          # bech32 decode, relay race, NIP-39 extraction
└── routes/
    ├── +page.svelte      # Landing — search, featured profile, explainers
    └── [username]/
        └── +page.svelte  # Portfolio — GitHub stats, languages, repos
```

---

## How the Nostr lookup works today

```
npub entered
    │
    ▼
bech32 decode ──► 32-byte hex pubkey          (src/lib/nostr.ts · npubToHex)
    │
    ▼
WebSocket REQ fired in parallel to 4 relays:
  wss://relay.damus.io
  wss://relay.nostr.band
  wss://nos.lol
  wss://relay.snort.social
    │
    ▼  (first EVENT kind:0 response wins)
profile metadata JSON parsed
    │
    ├─► NIP-39 `i` tag?  ["i", "github:username", proof]  ──► ✅ found
    ├─► `github` field in content JSON                     ──► ✅ found
    ├─► `github.com/` in `website` field                   ──► ✅ found
    ├─► `github.com/` in `about` field                     ──► ✅ found
    └─► nothing                                            ──► ⚠ show profile + NIP-39 link
```

This is a one-shot fetch — connect, request, read first response, disconnect. No persistent subscription, no caching, no reconnection logic.

---

## Next steps

### 1 — Replace raw WebSockets with NDK

The previous Svelte + Nostr prototype (`x.svelte.ndk/`) used [`@nostr-dev-kit/ndk`](https://github.com/nostr-dev-kit/ndk) which handles relay pool management, deduplication, signature verification, caching, and reconnection automatically.

**Install:**
```bash
npm install @nostr-dev-kit/ndk
```

**Drop-in NDK initialisation (browser-safe with SvelteKit):**
```ts
// src/lib/ndk.ts
import NDK from '@nostr-dev-kit/ndk';
import { browser } from '$app/environment';

export const ndk = new NDK({
  explicitRelayUrls: [
    'wss://relay.damus.io',
    'wss://relay.nostr.band',
    'wss://nos.lol',
    'wss://purplepag.es',
    'wss://xplb.uk',          // personal relay — fastest for own npubs
  ]
});

if (browser) {
  ndk.connect().then(() => console.log('NDK connected'));
}
```

**Fetch a profile (replaces the hand-rolled WebSocket in `nostr.ts`):**
```ts
import { ndk } from '$lib/ndk';

const user = ndk.getUser({ npub: 'npub1...' });
await user.fetchProfile();

// user.profile.name, user.profile.image, user.profile.about, user.profile.website
// NIP-39 identity claims live in user.profile.nip39Identities (NDK parses them)
```

**NIP-39 GitHub extraction with NDK:**
```ts
const github = user.profile?.nip39Identities
  ?.find(i => i.platform === 'github')
  ?.identity;  // e.g. "macos-node"
```

NDK parses `i` tags into structured `nip39Identities` — no regex needed.

---

### 2 — Live relay subscriptions for a dynamic feed

GitHub Pages is **static hosting only** — there is no server process. But NDK subscriptions are pure WebSocket (client-side), so they work perfectly on Pages.

Instead of fetching once and closing, subscribe to a live stream of events and reactively update the Svelte UI:

```ts
// Stream kind:1 notes (short text posts) from a given pubkey
import { ndk } from '$lib/ndk';
import { NDKEvent } from '@nostr-dev-kit/ndk';

let notes = $state<NDKEvent[]>([]);

const sub = ndk.subscribe(
  { kinds: [1], authors: [hexPubkey], limit: 20 },
  { closeOnEose: false }   // keep connection open for live updates
);

sub.on('event', (event: NDKEvent) => {
  notes = [event, ...notes].slice(0, 50);  // prepend, cap at 50
});
```

Bind `notes` to a Svelte `{#each}` block and the feed updates in real time as new notes arrive from relays — no server, no polling.

**Possible UI additions:**
- `/[username]/feed` — live kind:1 notes alongside the GitHub portfolio
- Zap count per note (kind:9735 receipts)
- Reactions (kind:7) rendered as emoji counters
- Profile banner image (`banner` field in kind:0 metadata)

---

### 3 — Testing relay connectivity locally

```bash
# Start dev server
npm run dev

# In a separate terminal — verify a relay is reachable
wscat -c wss://relay.damus.io
# then paste: ["REQ","test",{"kinds":[0],"authors":["<hex-pubkey>"],"limit":1}]
```

Install `wscat` with `npm install -g wscat`.

For the personal relay `wss://xplb.uk`, test auth / write permissions separately since it may require NIP-42 authentication before accepting REQs from unknown clients.

**NDK relay diagnostics:**
```ts
ndk.pool.on('relay:connect',    r => console.log('✅', r.url));
ndk.pool.on('relay:disconnect', r => console.log('❌', r.url));
ndk.pool.on('relay:notice',     (r, msg) => console.warn(r.url, msg));
```

---

### 4 — GitHub Pages constraints & workarounds

| Constraint | Impact | Workaround |
|---|---|---|
| Static hosting only | No server-side relay proxy | NDK runs entirely in the browser via WebSocket — no proxy needed |
| 60 req/hr GitHub API (unauthenticated) | Rate-limited for popular profiles | Cache responses in `sessionStorage`; or add a GitHub token via a Cloudflare Worker proxy |
| No environment variables at runtime | Can't hide API keys | Keep GitHub API unauthenticated; Nostr is open by design |
| SvelteKit `ssr: false` required on dynamic routes | `[username]` page must opt out of SSR | Already set in `src/routes/[username]/+page.ts` |
| `fallback: '404.html'` in adapter-static | Deep links like `/torvalds` work on reload | Already configured in `svelte.config.js` |

---

### 5 — Potential next pages / routes

| Route | Description |
|---|---|
| `/[username]/feed` | Live Nostr kind:1 note stream for the linked npub |
| `/[username]/zaps` | Zap receipts (kind:9735) — total sats received |
| `/relay` | Relay health dashboard — ping each relay, show latency |
| `/compare/[a]/[b]` | Side-by-side GitHub stats for two users |

All routes would be client-rendered (`ssr: false`, `prerender: false`) and deploy to Pages without any infrastructure change.

---

## Local development

```bash
# requires Node 22+
nvm use 22

npm install
npm run dev          # http://localhost:5173
npm run build        # production build → ./build
npm run preview      # preview production build locally
```

## Deploying

Push to `main` — GitHub Actions builds and deploys automatically.

To trigger a manual redeploy:
```bash
gh workflow run deploy.yml
```

---

*✦ Claude designed, coded, deployed, debugged & vibed this.*
