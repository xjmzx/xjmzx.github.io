<script lang="ts">
	import { onMount } from 'svelte';

	type GHUser = {
		login: string; name: string | null; avatar_url: string;
		bio: string | null; location: string | null;
		company: string | null; blog: string | null;
		twitter_username: string | null; html_url: string;
		public_repos: number; followers: number; following: number;
	};

	type GHRepo = {
		name: string; html_url: string; language: string | null;
		updated_at: string; description: string | null;
		stargazers_count: number; forks_count: number;
	};

	const FEATURED_USER = 'xjmzx';

	let user = $state<GHUser | null>(null);
	let repos = $state<GHRepo[]>([]);
	let loading = $state(true);

	onMount(async () => {
		try {
			const [userRes, reposRes] = await Promise.all([
				fetch(`https://api.github.com/users/${FEATURED_USER}`),
				fetch(`https://api.github.com/users/${FEATURED_USER}/repos?sort=updated&per_page=6`)
			]);
			if (userRes.ok) user = await userRes.json();
			if (reposRes.ok) repos = await reposRes.json();
		} catch { /* ignore */ }
		loading = false;
	});

	function formatDate(dateStr: string) {
		const d = new Date(dateStr);
		const now = new Date();
		const days = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
		if (days === 0) return 'today';
		if (days === 1) return 'yesterday';
		if (days < 7) return `${days} days ago`;
		if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
		return `${Math.floor(days / 30)} months ago`;
	}
</script>

<svelte:head>
	<title>{user?.name ?? FEATURED_USER}</title>
</svelte:head>

<main class="min-h-screen flex flex-col">
	<!-- Nav -->
	<nav class="flex items-center justify-between px-6 py-4 border-b border-white/10">
		<span class="font-bold text-lg tracking-tight text-white">
			<span class="text-emerald-400">Git</span>Folio
		</span>
		{#if user}
			<a
				href={user.html_url}
				target="_blank"
				rel="noopener"
				class="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
			>
				<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
					<path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
				</svg>
				GitHub
			</a>
		{/if}
	</nav>

	{#if loading}
		<div class="flex flex-col items-center justify-center py-32 gap-4">
			<div class="w-10 h-10 rounded-full border-2 border-emerald-500/30 border-t-emerald-500 animate-spin"></div>
		</div>
	{:else if user}
		<!-- Contact & Info -->
		<section class="px-4 pt-12 pb-8 max-w-2xl mx-auto w-full">
			<!-- Get in Touch -->
			<div class="rounded-2xl border border-white/8 bg-white/3 p-6 mb-6">
				<h2 class="text-sm font-semibold text-white/50 uppercase tracking-wider mb-4">Get in Touch</h2>
				<div class="flex items-center gap-4 mb-4">
					<img src={user.avatar_url} alt={user.login} class="w-12 h-12 rounded-lg ring-2 ring-white/10" />
					<div>
						<div class="font-semibold text-white">{user.name ?? user.login}</div>
						<a href={user.html_url} target="_blank" rel="noopener" class="text-sm text-white/50 hover:text-white">@{user.login}</a>
					</div>
				</div>
				<div class="flex flex-wrap gap-3 justify-start">
					{#if user.blog}
						<a
							href={user.blog.startsWith('http') ? user.blog : `https://${user.blog}`}
							target="_blank"
							rel="noopener"
							class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition-all text-sm"
						>
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
							</svg>
							Website
						</a>
					{/if}
					{#if user.twitter_username}
						<a
							href={`https://twitter.com/${user.twitter_username}`}
							target="_blank"
							rel="noopener"
							class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition-all text-sm"
						>
							<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
								<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
							</svg>
							Twitter
						</a>
					{/if}
					<a
						href={user.html_url}
						target="_blank"
						rel="noopener"
						class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition-all text-sm"
					>
						<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
							<path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
						</svg>
						GitHub
					</a>
					<a
						href="https://gist.githubusercontent.com/xjmzx/2dcedf40a54d41d9af8ae1680f2da9d9"
						target="_blank"
						rel="noopener"
						class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition-all text-sm"
					>
						<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
							<path d="M12 0C5.37 0 0 5.37 0 12c0 6.63 5.37 12 12 12s12-5.37 12-12S18.63 0 12 0zm0 22c-5.52 0-10-4.48-10-10S6.48 2 12 2s10 4.48 10 10-4.48 10-10 10z"/>
						</svg>
						Nostr
					</a>
				</div>
			</div>

			<!-- Stats -->
			<div class="grid grid-cols-3 gap-3 mb-6">
				<div class="rounded-xl border border-white/8 bg-white/3 p-4 text-center">
					<div class="text-2xl font-bold text-white">{user.public_repos}</div>
					<div class="text-xs text-white/40 mt-1">Repos</div>
				</div>
				<div class="rounded-xl border border-white/8 bg-white/3 p-4 text-center">
					<div class="text-2xl font-bold text-white">{user.followers}</div>
					<div class="text-xs text-white/40 mt-1">Followers</div>
				</div>
				<div class="rounded-xl border border-white/8 bg-white/3 p-4 text-center">
					<div class="text-2xl font-bold text-white">{user.following}</div>
					<div class="text-xs text-white/40 mt-1">Following</div>
				</div>
			</div>
		</section>

		<!-- Recently Updated -->
		{#if repos.length > 0}
			<section class="px-4 pb-8 max-w-2xl mx-auto w-full">
				<div class="rounded-2xl border border-white/8 bg-white/3 p-6">
					<h2 class="text-sm font-semibold text-white/50 uppercase tracking-wider mb-4">Recent Activity</h2>
					<div class="flex flex-col gap-3">
						{#each repos as repo}
							<a
								href={repo.html_url}
								target="_blank"
								rel="noopener"
								class="block group"
							>
								<div class="flex items-start justify-between gap-3">
									<div class="flex-1 min-w-0">
										<div class="font-medium text-white group-hover:text-emerald-400 transition-colors truncate">
											{repo.name}
										</div>
										{#if repo.description}
											<div class="text-sm text-white/50 truncate mt-0.5">{repo.description}</div>
										{/if}
									</div>
									<div class="flex flex-col items-end gap-1 shrink-0">
										{#if repo.language}
											<span class="text-xs px-2 py-0.5 rounded bg-white/5 text-white/60">{repo.language}</span>
										{/if}
										<span class="text-xs text-white/30">{formatDate(repo.updated_at)}</span>
									</div>
								</div>
							</a>
						{/each}
					</div>
				</div>
			</section>
		{/if}

		<!-- Background / Details -->
		{#if user.location || user.company}
			<section class="px-4 pb-16 max-w-2xl mx-auto w-full">
				<div class="rounded-2xl border border-white/8 bg-white/3 p-6">
					<h2 class="text-sm font-semibold text-white/50 uppercase tracking-wider mb-4">Background</h2>
					<div class="flex flex-col gap-3">
						{#if user.location}
							<div class="flex items-center gap-3 text-white/70">
								<svg class="w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
								</svg>
								{user.location}
							</div>
						{/if}
						{#if user.company}
							<div class="flex items-center gap-3 text-white/70">
								<svg class="w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
								</svg>
								{user.company}
							</div>
						{/if}
					</div>
				</div>
			</section>
		{/if}
	{:else}
		<section class="flex flex-col items-center justify-center px-4 pt-20 pb-12 text-center">
			<p class="text-white/50">User not found</p>
		</section>
	{/if}

	<footer class="text-center text-sm text-white/25 pb-6">
		<a href="https://svelte.dev" class="hover:text-white/50 transition-colors">Built with Svelte</a>
	</footer>
</main>