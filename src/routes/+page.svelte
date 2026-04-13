<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { isNpub, lookupGitHubFromNpub } from '$lib/nostr';

	const FEATURED_USER = 'xjmzx';

	let input = $state('');
	let error = $state('');
	let nostrState = $state<'idle' | 'looking' | 'no-github'>('idle');
	let nostrProfile = $state<{ name?: string; picture?: string; about?: string; nip05?: string } | null>(null);
	let nostrReason = $state('');

	const inputIsNpub = $derived(isNpub(input));

	type GHUser = {
		login: string; name: string | null; avatar_url: string;
		bio: string | null; location: string | null;
		public_repos: number; followers: number; following: number;
	};

	let featured = $state<GHUser | null>(null);
	let featuredStars = $state(0);

	const examples = ['nodestate', 'xplbzx', 'npub10k4369fjd7xlcmsnn5upjcs3gvfuslnwzj7k9mpkdz8jxwng5ersl7m6hh'];

	onMount(async () => {
		try {
			const [uRes, rRes] = await Promise.all([
				fetch(`https://api.github.com/users/${FEATURED_USER}`),
				fetch(`https://api.github.com/users/${FEATURED_USER}/repos?per_page=100`)
			]);
			if (uRes.ok) {
				featured = await uRes.json();
				if (rRes.ok) {
					const repos: { stargazers_count: number }[] = await rRes.json();
					featuredStars = repos.reduce((s, r) => s + r.stargazers_count, 0);
				}
			}
		} catch { /* silently ignore */ }
	});

	async function submit() {
		const val = input.trim();
		if (!val) { error = 'Enter a GitHub username or Nostr npub'; return; }
		error = '';

		if (isNpub(val)) {
			nostrState = 'looking';
			nostrProfile = null;
			nostrReason = '';
			const result = await lookupGitHubFromNpub(val);
			if (result.found) {
				nostrState = 'idle';
				goto(`/${result.github}`);
			} else {
				nostrState = 'no-github';
				nostrProfile = result.profile;
				nostrReason = result.reason;
			}
		} else {
			goto(`/${val}`);
		}
	}

	function onkeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') submit();
	}
</script>

<svelte:head>
	<title>GitFolio — GitHub Portfolio Generator</title>
</svelte:head>

<main class="min-h-screen flex flex-col">
	<!-- Nav -->
	<nav class="flex items-center justify-between px-6 py-4 border-b border-white/10">
		<span class="font-bold text-lg tracking-tight text-white">
			<span class="text-emerald-400">Git</span>Folio
		</span>
		<a
			href="https://github.com/xjmzx/xjmzx.github.io"
			target="_blank"
			rel="noopener"
			class="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
		>
			<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
				<path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
			</svg>
			View Source
		</a>
	</nav>

	<!-- Hero -->
	<section class="flex flex-col items-center justify-center px-4 pt-20 pb-12 text-center">
		<h1 class="text-5xl sm:text-6xl md:text-7xl font-bold leading-tight mb-6 max-w-3xl">
			Transform your
			<span class="bg-gradient-to-r from-purple-400 via-emerald-400 to-teal-300 bg-clip-text text-transparent"> Npub </span>
			into a portfolio
		</h1>

		<p class="text-lg text-white/50 mb-12 max-w-xl">
			Enter a GitHub username or a Nostr <code class="text-emerald-400/80 font-mono text-sm">npub</code> to generate a beautiful, shareable developer portfolio.
		</p>

		<!-- Search -->
		<div class="w-full max-w-md">
			<div class="flex gap-2">
				<div class="relative flex-1">
					<!-- Icon: Nostr (purple) when npub detected, GitHub (dim) otherwise -->
					{#if inputIsNpub}
						<!-- Nostr lightning bolt -->
						<svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
							<path d="M13 2L4.09 12.97H11L10 22l8.91-10.97H13L14 2z"/>
						</svg>
					{:else}
						<!-- GitHub mark -->
						<svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" fill="currentColor" viewBox="0 0 24 24">
							<path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
						</svg>
					{/if}
					<input
						type="text"
						placeholder={inputIsNpub ? 'Nostr npub detected…' : 'GitHub username or npub1…'}
						bind:value={input}
						{onkeydown}
						class="w-full pl-9 pr-4 py-3 rounded-xl bg-white/5 border text-white placeholder-white/30 focus:outline-none transition-all
							{inputIsNpub
								? 'border-purple-500/50 focus:border-purple-400'
								: 'border-white/10 focus:border-emerald-500/50'}"
					/>
				</div>
				<button
					onclick={submit}
					disabled={nostrState === 'looking'}
					class="px-5 py-3 rounded-xl font-semibold transition-colors shrink-0 disabled:opacity-60
						{inputIsNpub
							? 'bg-purple-500 hover:bg-purple-400 text-white'
							: 'bg-emerald-500 hover:bg-emerald-400 text-black'}"
				>
					{nostrState === 'looking' ? 'Looking…' : 'Generate'}
				</button>
			</div>

			<!-- hint badge -->
			{#if inputIsNpub}
				<p class="text-xs text-purple-400/70 mt-2 text-left">
					Nostr npub detected — will look up linked GitHub account via NIP-39
				</p>
			{/if}

			{#if error}
				<p class="text-red-400 text-sm mt-2 text-left">{error}</p>
			{/if}

			<!-- Nostr lookup in progress -->
			{#if nostrState === 'looking'}
				<div class="mt-4 flex items-center gap-3 rounded-xl border border-purple-500/20 bg-purple-500/5 px-4 py-3">
					<div class="w-4 h-4 rounded-full border-2 border-purple-500/30 border-t-purple-400 animate-spin shrink-0"></div>
					<span class="text-sm text-purple-300/80">Querying Nostr relays for linked GitHub account…</span>
				</div>
			{/if}

			<!-- No GitHub linked -->
			{#if nostrState === 'no-github'}
				<div class="mt-4 rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4 text-left">
					{#if nostrProfile?.picture || nostrProfile?.name}
						<div class="flex items-center gap-3 mb-3">
							{#if nostrProfile.picture}
								<img src={nostrProfile.picture} alt="" class="w-10 h-10 rounded-lg shrink-0 object-cover" />
							{/if}
							<div>
								{#if nostrProfile.name}<div class="text-sm font-semibold">{nostrProfile.name}</div>{/if}
								{#if nostrProfile.nip05}<div class="text-xs text-white/40">{nostrProfile.nip05}</div>{/if}
							</div>
						</div>
					{/if}
					<p class="text-sm text-yellow-300/80">{nostrReason}</p>
					<a
						href="https://github.com/nostr-protocol/nostr/blob/master/nips/39.md"
						target="_blank"
						rel="noopener"
						class="inline-block mt-2 text-xs text-yellow-400/60 hover:text-yellow-400 transition-colors"
					>
						Learn about NIP-39 identity claims →
					</a>
				</div>
			{/if}

			<div class="flex flex-wrap gap-2 mt-4 justify-center items-center">
				<span class="text-white/30 text-sm">Try:</span>
				{#each examples as ex}
					<button
						onclick={() => { input = ex; if (!isNpub(ex)) goto(`/${ex}`); }}
						class="text-sm transition-colors font-mono
							{isNpub(ex)
								? 'text-purple-400/70 hover:text-purple-400 max-w-[14ch] truncate'
								: 'text-emerald-400/70 hover:text-emerald-400'}"
						title={ex}
					>
						{isNpub(ex) ? ex.slice(0, 10) + '…' : ex}
					</button>
				{/each}
			</div>
		</div>

		<!-- Explainers -->
		<div class="w-full max-w-2xl mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
			<!-- NIP-39 -->
			<div class="rounded-xl border border-purple-500/15 bg-purple-500/5 p-5">
				<div class="flex items-center gap-2 mb-3">
					<span class="text-purple-400 text-base">⚡</span>
					<span class="text-sm font-semibold text-purple-300">Nostr External Identities (NIP-39)</span>
				</div>
				<p class="text-xs text-white/45 leading-relaxed">
					Paste any <code class="text-purple-300/80 font-mono">npub</code> into the search field. The key is decoded from bech32 into a raw hex public key, then broadcast as a metadata request (<code class="text-purple-300/80 font-mono">REQ kind:0</code>) across multiple Nostr relays simultaneously. The first relay to respond returns the user's profile event. We then inspect its <code class="text-purple-300/80 font-mono">i</code> tags for an entry of the form <code class="text-purple-300/80 font-mono">["i", "github:username", ...]</code> — a signed identity claim defined by NIP-39 — and load that GitHub profile directly.
				</p>
				<a
					href="https://github.com/nostr-protocol/nostr/blob/master/nips/39.md"
					target="_blank"
					rel="noopener"
					class="inline-block mt-3 text-xs text-purple-400/50 hover:text-purple-400 transition-colors"
				>
					Read NIP-39 spec →
				</a>
			</div>

			<!-- Fallback strategy -->
			<div class="rounded-xl border border-amber-500/15 bg-amber-500/5 p-5">
				<div class="flex items-center gap-2 mb-3">
					<span class="text-amber-400 text-base">🔍</span>
					<span class="text-sm font-semibold text-amber-300">Fallback: website &amp; about fields</span>
				</div>
				<p class="text-xs text-white/45 leading-relaxed">
					NIP-39 GitHub identity claims are not yet widely adopted across Nostr clients. When no <code class="text-amber-300/80 font-mono">i</code> tag is present, we fall back to scanning the profile's metadata JSON for a <code class="text-amber-300/80 font-mono">github</code> field, then look for a <code class="text-amber-300/80 font-mono">github.com/</code> link inside the <code class="text-amber-300/80 font-mono">website</code> and <code class="text-amber-300/80 font-mono">about</code> fields. Many developers informally list their GitHub there, making this a practical bridge until NIP-39 adoption grows.
				</p>
				<a
					href="https://github.com/nostr-protocol/nostr/blob/master/nips/39.md#claim-types"
					target="_blank"
					rel="noopener"
					class="inline-block mt-3 text-xs text-amber-400/50 hover:text-amber-400 transition-colors"
				>
					NIP-39 claim types →
				</a>
			</div>
		</div>
	</section>

	<!-- Featured profile -->
	{#if featured}
		<section class="px-4 pb-14 max-w-2xl mx-auto w-full">
			<p class="text-xs text-white/30 uppercase tracking-wider text-center mb-4">Site owner</p>
			<a
				href={`/${featured.login}`}
				class="block rounded-2xl border border-white/8 bg-white/3 hover:border-emerald-500/30 hover:bg-white/5 transition-all p-6"
			>
				<div class="flex items-center gap-4 mb-5">
					<img src={featured.avatar_url} alt={featured.login} class="w-14 h-14 rounded-xl ring-2 ring-white/10 shrink-0" />
					<div class="min-w-0">
						<div class="font-semibold text-base">{featured.name ?? featured.login}</div>
						<div class="text-sm text-white/40">@{featured.login}</div>
						{#if featured.bio}
							<div class="text-xs text-white/40 mt-1 truncate">{featured.bio}</div>
						{/if}
					</div>
					<span class="ml-auto text-xs text-emerald-400/70 border border-emerald-500/20 rounded-full px-2.5 py-1 shrink-0">View portfolio →</span>
				</div>
				<div class="grid grid-cols-4 gap-3 text-center">
					{#each [
						{ label: 'Repos', value: featured.public_repos },
						{ label: 'Stars', value: featuredStars },
						{ label: 'Followers', value: featured.followers },
						{ label: 'Following', value: featured.following },
					] as s}
						<div class="rounded-lg bg-white/5 py-3">
							<div class="text-base font-bold">{s.value.toLocaleString()}</div>
							<div class="text-xs text-white/35 mt-0.5">{s.label}</div>
						</div>
					{/each}
				</div>
			</a>
		</section>
	{/if}

	<!-- Features -->
	<section class="grid grid-cols-1 sm:grid-cols-3 gap-4 px-6 pb-16 max-w-4xl mx-auto w-full">
		{#each [
			{ icon: '⚡', title: 'Instant', desc: 'Portfolio generated in seconds from the GitHub API' },
			{ icon: '🔮', title: 'Nostr-native', desc: 'Enter an npub to find the linked GitHub account via NIP-39' },
			{ icon: '🔗', title: 'Shareable', desc: 'Every portfolio has a unique URL you can share anywhere' },
		] as f}
			<div class="rounded-xl border border-white/8 bg-white/3 p-5">
				<div class="text-2xl mb-2">{f.icon}</div>
				<div class="font-semibold mb-1">{f.title}</div>
				<div class="text-sm text-white/40">{f.desc}</div>
			</div>
		{/each}
	</section>

	<footer class="text-center text-sm text-white/25 pb-6 flex flex-col items-center gap-2">
		<a
			href="https://github.com/xjmzx/xjmzx.github.io"
			target="_blank"
			rel="noopener"
			class="inline-flex items-center gap-1.5 text-white/40 hover:text-white transition-colors"
		>
			<svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
				<path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
			</svg>
			Open source on GitHub
		</a>
		<span>Built with <a href="https://svelte.dev" class="hover:text-white/50 transition-colors">Svelte</a> · Powered by GitHub API &amp; Nostr</span>
	</footer>
</main>
