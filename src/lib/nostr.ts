// Nostr utilities: npub decode + relay lookup for linked GitHub accounts

// ── bech32 decode ──────────────────────────────────────────────────────────

const CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';

function convertBits(data: number[], from: number, to: number, pad: boolean): number[] | null {
	let acc = 0, bits = 0;
	const result: number[] = [];
	const maxv = (1 << to) - 1;
	for (const v of data) {
		acc = (acc << from) | v;
		bits += from;
		while (bits >= to) {
			bits -= to;
			result.push((acc >> bits) & maxv);
		}
	}
	if (pad) {
		if (bits > 0) result.push((acc << (to - bits)) & maxv);
	} else if (bits >= from || ((acc << (to - bits)) & maxv)) {
		return null;
	}
	return result;
}

/** Decode an npub string to a 32-byte hex public key, or null if invalid. */
export function npubToHex(npub: string): string | null {
	const str = npub.toLowerCase().trim();
	if (!str.startsWith('npub1')) return null;
	const sep = str.lastIndexOf('1');
	if (sep < 1 || sep + 7 > str.length) return null;

	const data5: number[] = [];
	for (const c of str.slice(sep + 1)) {
		const idx = CHARSET.indexOf(c);
		if (idx < 0) return null;
		data5.push(idx);
	}

	// last 6 chars are checksum — drop them, convert 5-bit groups → bytes
	const bytes = convertBits(data5.slice(0, -6), 5, 8, false);
	if (!bytes || bytes.length !== 32) return null;
	return bytes.map(b => b.toString(16).padStart(2, '0')).join('');
}

/** Returns true if the string looks like a bech32 npub. */
export function isNpub(val: string): boolean {
	return /^npub1[qpzry9x8gf2tvdw0s3jn54khce6mua7l]{6,}$/i.test(val.trim());
}

// ── Nostr relay lookup ─────────────────────────────────────────────────────

const RELAYS = [
	'wss://relay.damus.io',
	'wss://relay.nostr.band',
	'wss://nos.lol',
	'wss://relay.snort.social',
];

type NostrEvent = {
	tags: string[][];
	content: string;
};

/** Extract a GitHub username from a Nostr kind:0 event.
 *  Checks (in order):
 *  1. NIP-39 `i` tag  → ["i", "github:username", ...]
 *  2. Profile metadata JSON `github` field
 *  3. `website` field containing github.com/username
 *  4. `about` / `bio` field containing github.com/username
 */
function extractGitHub(event: NostrEvent): string | null {
	// 1. NIP-39
	for (const tag of event.tags) {
		if (tag[0] === 'i' && typeof tag[1] === 'string' && tag[1].startsWith('github:')) {
			const username = tag[1].slice(7).trim();
			if (username) return username;
		}
	}

	// 2–4. Profile metadata JSON
	try {
		const meta: Record<string, string> = JSON.parse(event.content);
		if (meta.github) return meta.github.trim();
		const ghRe = /github\.com\/([A-Za-z0-9_-]+)/;
		for (const field of ['website', 'about', 'bio']) {
			if (meta[field]) {
				const m = meta[field].match(ghRe);
				if (m) return m[1];
			}
		}
	} catch { /* malformed content */ }

	return null;
}

export type NostrProfile = {
	name?: string;
	display_name?: string;
	picture?: string;
	about?: string;
	website?: string;
	nip05?: string;
};

export type LookupResult =
	| { found: true; github: string; profile: NostrProfile }
	| { found: false; profile: NostrProfile | null; reason: string };

/** Query Nostr relays for the kind:0 event of `hexPubkey`.
 *  Resolves with the first result (race across all relays). */
async function fetchKind0(hexPubkey: string): Promise<NostrEvent | null> {
	return new Promise(resolve => {
		let settled = false;
		let closed = 0;

		const done = (event: NostrEvent | null) => {
			if (settled) return;
			settled = true;
			resolve(event);
		};

		for (const url of RELAYS) {
			let ws: WebSocket;
			try { ws = new WebSocket(url); } catch { closed++; if (closed === RELAYS.length) done(null); continue; }

			const subId = Math.random().toString(36).slice(2, 8);
			const timer = setTimeout(() => { ws.close(); closed++; if (closed === RELAYS.length) done(null); }, 6000);

			ws.onopen = () => {
				ws.send(JSON.stringify(['REQ', subId, { kinds: [0], authors: [hexPubkey], limit: 1 }]));
			};

			ws.onmessage = (e: MessageEvent) => {
				try {
					const msg = JSON.parse(e.data as string);
					if (msg[0] === 'EVENT' && msg[1] === subId && msg[2]?.pubkey === hexPubkey) {
						clearTimeout(timer);
						ws.close();
						done(msg[2] as NostrEvent);
					} else if (msg[0] === 'EOSE') {
						clearTimeout(timer);
						ws.close();
						closed++;
						if (closed === RELAYS.length) done(null);
					}
				} catch { /* ignore */ }
			};

			ws.onerror = () => { clearTimeout(timer); closed++; if (closed === RELAYS.length) done(null); };
			ws.onclose = () => { clearTimeout(timer); };
		}
	});
}

/** Main entry point: given an npub, resolve to a GitHub username (or explain why not). */
export async function lookupGitHubFromNpub(npub: string): Promise<LookupResult> {
	const hex = npubToHex(npub);
	if (!hex) return { found: false, profile: null, reason: 'Invalid npub — could not decode.' };

	const event = await fetchKind0(hex);
	if (!event) return { found: false, profile: null, reason: 'No Nostr profile found on any relay. The key may not have published a profile yet.' };

	let profile: NostrProfile = {};
	try { profile = JSON.parse(event.content); } catch { /* ok */ }

	const github = extractGitHub(event);
	if (!github) {
		return {
			found: false,
			profile,
			reason: 'Nostr profile found, but no GitHub account is linked. The user can add one via NIP-39 (identity claims).'
		};
	}

	return { found: true, github, profile };
}
