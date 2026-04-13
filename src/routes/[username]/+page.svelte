<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	const username = $derived(page.params.username);

	type GHUser = {
		login: string;
		name: string | null;
		avatar_url: string;
		bio: string | null;
		blog: string | null;
		location: string | null;
		company: string | null;
		twitter_username: string | null;
		public_repos: number;
		followers: number;
		following: number;
		html_url: string;
		created_at: string;
	};

	type GHRepo = {
		name: string;
		description: string | null;
		html_url: string;
		stargazers_count: number;
		forks_count: number;
		language: string | null;
		fork: boolean;
		updated_at: string;
	};

	let user = $state<GHUser | null>(null);
	let repos = $state<GHRepo[]>([]);
	let loading = $state(true);
	let err = $state('');
	let copied = $state(false);
	let search = $state('');

	const langColors: Record<string, string> = {
		TypeScript: '#3178c6', JavaScript: '#f1e05a', Python: '#3572A5',
		Rust: '#dea584', Go: '#00ADD8', Vue: '#41b883', Svelte: '#ff3e00',
		CSS: '#563d7c', HTML: '#e34c26', Shell: '#89e051', C: '#555555',
		'C++': '#f34b7d', Java: '#b07219', Ruby: '#701516', PHP: '#4F5D95',
		Kotlin: '#A97BFF', Swift: '#F05138', Dart: '#00B4AB',
	};

	const topLangs = $derived.by(() => {
		const counts: Record<string, number> = {};
		for (const r of repos) {
			if (r.language) counts[r.language] = (counts[r.language] ?? 0) + 1;
		}
		return Object.entries(counts)
			.sort((a, b) => b[1] - a[1])
			.slice(0, 6)
			.map(([lang, count]) => ({ lang, count, color: langColors[lang] ?? '#8b949e' }));
	});

	const totalStars = $derived(repos.reduce((s, r) => s + r.stargazers_count, 0));

	const filteredRepos = $derived(
		repos
			.filter(r => !r.fork)
			.filter(r => !search || r.name.toLowerCase().includes(search.toLowerCase()) || (r.description ?? '').toLowerCase().includes(search.toLowerCase()))
			.sort((a, b) => b.stargazers_count - a.stargazers_count)
			.slice(0, 12)
	);

	async function load() {
		loading = true;
		err = '';
		try {
			const [uRes, rRes] = await Promise.all([
				fetch(`https://api.github.com/users/${username}`),
				fetch(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`)
			]);
			if (!uRes.ok) {
				err = uRes.status === 404 ? `User "${username}" not found on GitHub.` : 'GitHub API error. Try again later.';
				loading = false;
				return;
			}
			user = await uRes.json();
			repos = rRes.ok ? await rRes.json() : [];
		} catch {
			err = 'Network error. Check your connection.';
		}
		loading = false;
	}

	onMount(load);

	function copyLink() {
		navigator.clipboard.writeText(window.location.href);
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}

	function formatDate(iso: string) {
		return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
	}
</script>

<svelte:head>
	<title>{user?.name ?? username} — GitFolio</title>
</svelte:head>

<!-- Nav -->
<nav class="flex items-center justify-between px-6 py-4 border-b border-white/10 sticky top-0 bg-[#0d1117]/90 backdrop-blur-sm z-10">
	<a href="/" class="font-bold text-lg tracking-tight text-white">
		<span class="text-emerald-400">Git</span>Folio
	</a>
	<div class="flex items-center gap-3">
		{#if user}
			<button
				onclick={copyLink}
				class="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-sm transition-all"
			>
				{#if copied}
					<svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
					</svg>
					<span class="text-emerald-400">Copied!</span>
				{:else}
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
					</svg>
					Share
				{/if}
			</button>
		{/if}
		<button onclick={() => goto('/')} class="text-sm text-white/50 hover:text-white transition-colors">← Back</button>
	</div>
</nav>

<main class="max-w-5xl mx-auto px-4 py-10">
	{#if loading}
		<div class="flex flex-col items-center justify-center py-32 gap-4">
			<div class="w-10 h-10 rounded-full border-2 border-emerald-500/30 border-t-emerald-500 animate-spin"></div>
			<p class="text-white/40 text-sm">Fetching profile…</p>
		</div>

	{:else if err}
		<div class="flex flex-col items-center justify-center py-32 gap-4 text-center">
			<div class="text-5xl">🔍</div>
			<p class="text-white/70">{err}</p>
			<button onclick={() => goto('/')} class="mt-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-sm transition-colors">
				Try another
			</button>
		</div>

	{:else if user}
		<!-- Profile header -->
		<div class="flex flex-col sm:flex-row gap-6 items-start mb-10">
			<img src={user.avatar_url} alt={user.login} class="w-24 h-24 rounded-2xl ring-2 ring-white/10 shrink-0" />
			<div class="flex-1 min-w-0">
				<div class="flex flex-wrap items-center gap-3 mb-1">
					<h1 class="text-2xl font-bold">{user.name ?? user.login}</h1>
					<a href={user.html_url} target="_blank" rel="noopener"
						class="text-xs px-2 py-0.5 rounded-full border border-white/10 text-white/50 hover:text-white hover:border-white/30 transition-colors">
						@{user.login}
					</a>
				</div>
				{#if user.bio}<p class="text-white/60 text-sm mb-3 max-w-lg">{user.bio}</p>{/if}

				<div class="flex flex-wrap gap-4 text-sm text-white/40 mb-4">
					{#if user.location}
						<span class="flex items-center gap-1">
							<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
							</svg>
							{user.location}
						</span>
					{/if}
					{#if user.blog}
						<a href={user.blog.startsWith('http') ? user.blog : `https://${user.blog}`} target="_blank" rel="noopener"
							class="flex items-center gap-1 hover:text-white transition-colors">
							<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
							</svg>
							{user.blog.replace(/^https?:\/\//, '')}
						</a>
					{/if}
					{#if user.twitter_username}
						<a href={`https://twitter.com/${user.twitter_username}`} target="_blank" rel="noopener"
							class="flex items-center gap-1 hover:text-white transition-colors">
							<svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
								<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
							</svg>
							@{user.twitter_username}
						</a>
					{/if}
					<span class="flex items-center gap-1">
						<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
						</svg>
						Joined {formatDate(user.created_at)}
					</span>
				</div>
			</div>
		</div>

		<!-- Stats grid -->
		<div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
			{#each [
				{ label: 'Repositories', value: user.public_repos },
				{ label: 'Stars earned', value: totalStars },
				{ label: 'Followers', value: user.followers },
				{ label: 'Following', value: user.following },
			] as stat}
				<div class="rounded-xl border border-white/8 bg-white/3 p-4 text-center">
					<div class="text-2xl font-bold text-white">{stat.value.toLocaleString()}</div>
					<div class="text-xs text-white/40 mt-1">{stat.label}</div>
				</div>
			{/each}
		</div>

		<!-- Languages -->
		{#if topLangs.length > 0}
			<div class="mb-10">
				<h2 class="text-sm font-semibold text-white/50 uppercase tracking-wider mb-3">Top Languages</h2>
				<div class="flex flex-wrap gap-2">
					{#each topLangs as { lang, count, color }}
						<span class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/8 text-sm">
							<span class="w-2.5 h-2.5 rounded-full shrink-0" style="background:{color}"></span>
							{lang}
							<span class="text-white/30 text-xs">{count}</span>
						</span>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Repos -->
		<div>
			<div class="flex items-center justify-between mb-4 gap-4 flex-wrap">
				<h2 class="text-sm font-semibold text-white/50 uppercase tracking-wider">Repositories</h2>
				<input
					type="text"
					placeholder="Filter repos…"
					bind:value={search}
					class="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder-white/30 focus:outline-none focus:border-emerald-500/50 w-48"
				/>
			</div>

			{#if filteredRepos.length === 0}
				<p class="text-white/30 text-sm py-8 text-center">No repositories found.</p>
			{:else}
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
					{#each filteredRepos as repo}
						<a
							href={repo.html_url}
							target="_blank"
							rel="noopener"
							class="block rounded-xl border border-white/8 bg-white/3 p-4 hover:border-emerald-500/30 hover:bg-white/5 transition-all group"
						>
							<div class="flex items-start justify-between gap-2 mb-2">
								<span class="font-medium text-sm text-white group-hover:text-emerald-400 transition-colors truncate">
									{repo.name}
								</span>
								<svg class="w-3.5 h-3.5 text-white/20 shrink-0 group-hover:text-white/40 transition-colors mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
								</svg>
							</div>
							{#if repo.description}
								<p class="text-xs text-white/40 mb-3 line-clamp-2">{repo.description}</p>
							{/if}
							<div class="flex items-center gap-3 text-xs text-white/30">
								{#if repo.language}
									<span class="flex items-center gap-1">
										<span class="w-2 h-2 rounded-full" style="background:{langColors[repo.language] ?? '#8b949e'}"></span>
										{repo.language}
									</span>
								{/if}
								{#if repo.stargazers_count > 0}
									<span class="flex items-center gap-1">
										<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
											<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
										</svg>
										{repo.stargazers_count}
									</span>
								{/if}
								{#if repo.forks_count > 0}
									<span class="flex items-center gap-1">
										<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h8M8 12h8M8 17h4"/>
										</svg>
										{repo.forks_count}
									</span>
								{/if}
							</div>
						</a>
					{/each}
				</div>
			{/if}
		</div>
	{/if}
</main>

<footer class="text-center pb-8 pt-4">
	<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/8 text-white/30 text-xs">
		<span class="text-orange-400/80">✦</span>
		<a href="https://claude.ai" target="_blank" rel="noopener" class="text-orange-400/70 hover:text-orange-400 transition-colors font-medium">Claude</a>
		designed, coded, deployed, debugged &amp; vibed this
	</span>
</footer>
