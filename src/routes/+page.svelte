<script lang="ts">
	import { onMount } from 'svelte';
	import { base } from '$app/paths';

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
		stargazers_count: number; forks_count: number; fork: boolean;
	};

	type GHEvent = {
		id: string; type: string; created_at: string;
		repo: { name: string };
		payload: any;
	};

	type Activity = {
		icon: string; action: string; repo: string;
		detail: string | null; created_at: string; count?: number;
	};

	type LangSlice = { name: string; pct: number };

	type RepoDetail = {
		name: string; full: string; owner: string; html_url: string;
		description: string | null; stargazers_count: number; forks_count: number;
		updated_at: string | null; langs: LangSlice[]; external: boolean;
	};

	const FEATURED_USER = 'xjmzx';

	// GitHub-style language colours (fallback → accent-neutral grey)
	const LANG_COLORS: Record<string, string> = {
		Rust: '#dea584', TypeScript: '#3178c6', JavaScript: '#f1e05a',
		Svelte: '#ff3e00', Python: '#3572A5', Shell: '#89e051',
		HTML: '#e34c26', CSS: '#563d7c', Go: '#00ADD8', C: '#555555',
		'C++': '#f34b7d', Vue: '#41b883', Ruby: '#701516', Java: '#b07219',
		Swift: '#F05138', Kotlin: '#A97BFF', Nix: '#7e7eff', Dockerfile: '#384d54',
		Makefile: '#427819', SCSS: '#c6538c', SCSS_: '#c6538c', PLpgSQL: '#336790',
		Astro: '#ff5a03', MDX: '#fcb32c', Just: '#384d54', TOML: '#9c4221'
	};
	const langColor = (l: string) => LANG_COLORS[l] ?? '#8b949e';

	const SITE_REPO = `${FEATURED_USER}.github.io`;

	let user = $state<GHUser | null>(null);
	let repos = $state<GHRepo[]>([]);
	let events = $state<GHEvent[]>([]);
	let activeDetails = $state<RepoDetail[]>([]);
	let loading = $state(true);
	let showAll = $state(false);
	let rateLimited = $state(false);

	const totalStars = $derived(repos.reduce((a, r) => a + r.stargazers_count, 0));

	// This site's own Pages repo — shown minimally in the header, excluded elsewhere.
	const siteRepo = $derived(repos.find((r) => r.name === SITE_REPO) ?? null);
	const otherRepos = $derived(repos.filter((r) => r.name !== SITE_REPO));

	const languages = $derived.by(() => {
		const counts: Record<string, number> = {};
		for (const r of repos) if (r.language) counts[r.language] = (counts[r.language] ?? 0) + 1;
		const total = Object.values(counts).reduce((a, b) => a + b, 0);
		return Object.entries(counts)
			.sort((a, b) => b[1] - a[1])
			.slice(0, 6)
			.map(([name, n]) => ({ name, pct: total ? (n / total) * 100 : 0 }));
	});

	const visibleRepos = $derived(showAll ? otherRepos : otherRepos.slice(0, 6));

	const activity = $derived.by(() => {
		const out: Activity[] = [];
		for (const e of events) {
			const a = describe(e);
			if (!a) continue;
			if (a.repo === SITE_REPO) continue; // this site's own repo lives in the header
			// Collapse consecutive pushes to the same repo into one entry.
			const prev = out[out.length - 1];
			if (a.icon === 'commit' && prev?.icon === 'commit' && prev.repo === a.repo) {
				prev.count = (prev.count ?? 1) + 1;
				if (!prev.detail) prev.detail = a.detail;
				continue;
			}
			out.push(a);
		}
		return out.slice(0, 8);
	});

	onMount(async () => {
		try {
			const [userRes, reposRes, eventsRes] = await Promise.all([
				fetch(`https://api.github.com/users/${FEATURED_USER}`),
				fetch(`https://api.github.com/users/${FEATURED_USER}/repos?sort=updated&per_page=100`),
				fetch(`https://api.github.com/users/${FEATURED_USER}/events/public?per_page=30`)
			]);
			if (userRes.ok) user = await userRes.json();
			else if (userRes.status === 403) rateLimited = true;
			if (reposRes.ok) repos = await reposRes.json();
			if (eventsRes.ok) events = await eventsRes.json();
		} catch { /* ignore — offline / rate-limited */ }
		loading = false;

		// Second pass: background + per-repo language detail for the repos that
		// appear in Recent Activity (the site's own repo is excluded — it's in the header).
		const login = user?.login;
		if (!login) return;
		const siteFull = `${login}/${SITE_REPO}`;
		const seen = new Set<string>();
		const actives: string[] = [];
		for (const e of events) {
			const full = e.repo?.name;
			if (!full || full === siteFull || seen.has(full)) continue;
			seen.add(full);
			actives.push(full);
			if (actives.length >= 2) break;
		}
		const results = await Promise.all(actives.map((f) => loadRepoDetail(f, login)));
		activeDetails = results.filter((d): d is RepoDetail => d !== null);
	});

	/** Language byte-breakdown for a repo → sorted percentage slices. */
	async function fetchLangs(full: string): Promise<LangSlice[]> {
		try {
			const r = await fetch(`https://api.github.com/repos/${full}/languages`);
			if (!r.ok) return [];
			const data: Record<string, number> = await r.json();
			const total = Object.values(data).reduce((a, b) => a + b, 0);
			return Object.entries(data)
				.sort((a, b) => b[1] - a[1])
				.map(([name, bytes]) => ({ name, pct: total ? (bytes / total) * 100 : 0 }));
		} catch { return []; }
	}

	/** Background detail for one repo. Own repos reuse the already-fetched list;
	 *  external (e.g. starred) repos cost one extra call. */
	async function loadRepoDetail(full: string, ownLogin: string): Promise<RepoDetail | null> {
		const [owner, name] = full.split('/');
		if (!owner || !name) return null;
		const external = owner !== ownLogin;
		let description: string | null = null;
		let html_url = `https://github.com/${full}`;
		let stars = 0, forks = 0;
		let updated: string | null = null;

		const own = external ? undefined : repos.find((r) => r.name === name);
		if (own) {
			description = own.description; html_url = own.html_url;
			stars = own.stargazers_count; forks = own.forks_count; updated = own.updated_at;
		} else {
			try {
				const r = await fetch(`https://api.github.com/repos/${full}`);
				if (r.ok) {
					const d = await r.json();
					description = d.description; html_url = d.html_url;
					stars = d.stargazers_count; forks = d.forks_count; updated = d.updated_at;
				}
			} catch { /* keep defaults */ }
		}
		const langs = await fetchLangs(full);
		return { name, full, owner, html_url, description, stargazers_count: stars, forks_count: forks, updated_at: updated, langs, external };
	}

	function describe(e: GHEvent): Activity | null {
		const repo = e.repo?.name?.split('/')[1] ?? e.repo?.name ?? '';
		const at = e.created_at;
		switch (e.type) {
			case 'PushEvent': {
				// Mirror-pushed repos omit the commit array; count is often unavailable.
				const n = e.payload?.size ?? e.payload?.commits?.length ?? 0;
				const msg = e.payload?.commits?.at(-1)?.message?.split('\n')[0] ?? null;
				const action = n > 1 ? `Pushed ${n} commits to` : 'Pushed to';
				return { icon: 'commit', action, repo, detail: msg, created_at: at };
			}
			case 'PullRequestEvent': {
				const num = e.payload?.number ?? e.payload?.pull_request?.number;
				const merged = e.payload?.pull_request?.merged;
				const a = e.payload?.action ?? '';
				const verb = a === 'closed' ? (merged ? 'Merged' : 'Closed') : a.charAt(0).toUpperCase() + a.slice(1);
				return { icon: 'pr', action: `${verb} PR #${num} in`, repo, detail: e.payload?.pull_request?.title ?? null, created_at: at };
			}
			case 'IssuesEvent': {
				const num = e.payload?.issue?.number;
				const a = e.payload?.action ?? '';
				const verb = a.charAt(0).toUpperCase() + a.slice(1);
				return { icon: 'issue', action: `${verb} issue #${num} in`, repo, detail: e.payload?.issue?.title ?? null, created_at: at };
			}
			case 'CreateEvent': {
				const t = e.payload?.ref_type;
				if (t === 'repository') return { icon: 'branch', action: 'Created', repo, detail: null, created_at: at };
				return { icon: 'branch', action: `Created ${t} ${e.payload?.ref ?? ''} in`, repo, detail: null, created_at: at };
			}
			case 'ReleaseEvent':
				return { icon: 'tag', action: `Released ${e.payload?.release?.tag_name ?? ''} in`, repo, detail: null, created_at: at };
			case 'WatchEvent':
				return { icon: 'star', action: 'Starred', repo, detail: null, created_at: at };
			case 'ForkEvent':
				return { icon: 'fork', action: 'Forked', repo, detail: null, created_at: at };
			case 'IssueCommentEvent':
			case 'PullRequestReviewCommentEvent':
				return { icon: 'chat', action: 'Commented in', repo, detail: null, created_at: at };
			default:
				return null;
		}
	}

	function rel(dateStr: string) {
		const s = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
		if (s < 60) return 'now';
		const m = Math.floor(s / 60);
		if (m < 60) return `${m}m`;
		const h = Math.floor(m / 60);
		if (h < 24) return `${h}h`;
		const days = Math.floor(h / 24);
		if (days < 7) return `${days}d`;
		if (days < 30) return `${Math.floor(days / 7)}w`;
		if (days < 365) return `${Math.floor(days / 30)}mo`;
		return `${Math.floor(days / 365)}y`;
	}

	// Constant, internal SVG path fragments for the activity icons.
	const ICONS: Record<string, string> = {
		commit: '<circle cx="12" cy="12" r="3.5"/><path d="M12 3v5.5M12 15.5V21" stroke-width="2" stroke="currentColor" fill="none"/>',
		pr: '<circle cx="6" cy="6" r="2.5"/><circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M6 8.5v7M18 15.5V12a3 3 0 00-3-3h-4l2.5-2.5M11 9l2.5 2.5" stroke-width="2" stroke="currentColor" fill="none"/>',
		issue: '<circle cx="12" cy="12" r="8.5" stroke-width="2" stroke="currentColor" fill="none"/><circle cx="12" cy="12" r="2.5"/>',
		branch: '<circle cx="6" cy="6" r="2.5"/><circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="7" r="2.5"/><path d="M6 8.5v7M18 9.5c0 4-5 2.5-5 6.5" stroke-width="2" stroke="currentColor" fill="none"/>',
		tag: '<path d="M3 12l8-8 10 10-8 8z" stroke-width="2" stroke="currentColor" fill="none" stroke-linejoin="round"/><circle cx="8.5" cy="8.5" r="1.5"/>',
		star: '<path d="M12 3l2.6 5.6 6 .8-4.4 4.2 1.1 6-5.3-3-5.3 3 1.1-6L3.4 9.4l6-.8z"/>',
		fork: '<circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="12" cy="18" r="2.5"/><path d="M6 8.5c0 4 6 3 6 7M18 8.5c0 4-6 3-6 7" stroke-width="2" stroke="currentColor" fill="none"/>',
		chat: '<path d="M4 5h16v11H8l-4 4z" stroke-width="2" stroke="currentColor" fill="none" stroke-linejoin="round"/>'
	};
</script>

<svelte:head>
	<title>{user?.name ?? FEATURED_USER}</title>
</svelte:head>

<main class="min-h-screen flex flex-col">
	<!-- Nav -->
	<nav class="flex items-center justify-between px-6 py-3 border-b border-white/10">
		<span class="font-bold text-lg tracking-tight text-white">
			{FEATURED_USER}.github.io
		</span>
		{#if user}
			<a href={user.html_url} target="_blank" rel="noopener"
				class="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors">
				<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
				GitHub
			</a>
		{/if}
	</nav>

	{#if loading}
		<div class="flex flex-col items-center justify-center py-20 gap-4">
			<div class="w-10 h-10 rounded-full border-2 border-white/20 animate-spin"
				style="border-top-color: var(--accent)"></div>
		</div>
	{:else if user}
		<div class="w-full max-w-4xl mx-auto px-4 pt-8 pb-16 flex flex-col gap-4">

			<!-- Profile header + compact stat strip -->
			<header class="rounded-sm border border-white/8 bg-white/3 p-4">
				<div class="flex items-start gap-4 flex-wrap">
					<img src={user.avatar_url} alt={user.login}
						class="w-14 h-14 rounded-sm ring-2 ring-white/10 shrink-0" />
					<div class="flex-1 min-w-0">
						<div class="font-semibold text-white text-lg leading-tight">{user.name ?? user.login}</div>
						<a href={user.html_url} target="_blank" rel="noopener"
							class="text-sm text-white/50 hover:text-white">@{user.login}</a>
						{#if user.bio}<p class="text-sm text-white/60 mt-1">{user.bio}</p>{/if}
						{#if user.location || user.company}
							<div class="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-white/40">
								{#if user.location}
									<span class="inline-flex items-center gap-1">
										<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
										{user.location}
									</span>
								{/if}
								{#if user.company}
									<span class="inline-flex items-center gap-1">
										<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5"/></svg>
										{user.company}
									</span>
								{/if}
							</div>
						{/if}
					</div>
					<!-- Minimal "this site" chip -->
					{#if siteRepo}
						<div class="shrink-0 self-start rounded-sm border border-white/8 bg-white/5 px-3 py-2">
							<div class="text-[9px] uppercase tracking-wider text-white/35 mb-1">This site</div>
							<a href={siteRepo.html_url} target="_blank" rel="noopener"
								class="flex items-center gap-1.5 text-xs font-medium [color:var(--accent)] hover:underline">
								{SITE_REPO}
								<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
							</a>
							{#if siteRepo.language}
								<div class="flex items-center gap-1 mt-1 text-[10px] text-white/40">
									<span class="w-1.5 h-1.5 rounded-full" style="background:{langColor(siteRepo.language)}"></span>
									{siteRepo.language}
								</div>
							{/if}
						</div>
					{/if}

					<!-- Compact stat strip -->
					<div class="flex gap-4 shrink-0">
						<div class="text-center"><div class="text-lg font-bold text-white leading-none">{user.public_repos}</div><div class="text-[10px] text-white/40 mt-1 uppercase tracking-wide">Repos</div></div>
						<div class="text-center"><div class="text-lg font-bold text-white leading-none">{user.followers}</div><div class="text-[10px] text-white/40 mt-1 uppercase tracking-wide">Followers</div></div>
						<div class="text-center"><div class="text-lg font-bold text-white leading-none">{user.following}</div><div class="text-[10px] text-white/40 mt-1 uppercase tracking-wide">Following</div></div>
						<div class="text-center"><div class="text-lg font-bold text-white leading-none">{totalStars}</div><div class="text-[10px] text-white/40 mt-1 uppercase tracking-wide">Stars</div></div>
					</div>
				</div>

				<!-- Links -->
				<div class="flex flex-wrap gap-2 mt-3 pt-3 border-t border-white/8">
					{#if user.blog}
						<a href={user.blog.startsWith('http') ? user.blog : `https://${user.blog}`} target="_blank" rel="noopener"
							class="flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-white/5 border border-white/10 hover:border-white/20 transition-all text-xs text-white/70">
							<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
							Website
						</a>
					{/if}
					{#if user.twitter_username}
						<a href={`https://twitter.com/${user.twitter_username}`} target="_blank" rel="noopener"
							class="flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-white/5 border border-white/10 hover:border-white/20 transition-all text-xs text-white/70">
							<svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
							Twitter
						</a>
					{/if}
					<a href="https://gist.githubusercontent.com/xjmzx/2dcedf40a54d41d9af8ae1680f2da9d9" target="_blank" rel="noopener"
						class="flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-white/5 border border-white/10 hover:border-white/20 transition-all text-xs text-white/70">
						<svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 6.63 5.37 12 12 12s12-5.37 12-12S18.63 0 12 0zm0 22c-5.52 0-10-4.48-10-10S6.48 2 12 2s10 4.48 10 10-4.48 10-10 10z"/></svg>
						Nostr
					</a>
				</div>

				<!-- Languages bar -->
				{#if languages.length > 0}
					<div class="flex items-center gap-2 mt-3 text-xs">
						<span class="text-white/30 shrink-0">Languages</span>
						<span class="flex-1 h-2 rounded-full overflow-hidden flex bg-white/5">
							{#each languages as l}
								<span style="width:{l.pct}%; background:{langColor(l.name)}"></span>
							{/each}
						</span>
						<span class="text-white/50 shrink-0 truncate max-w-[45%]">{languages.map((l) => l.name).join(' · ')}</span>
					</div>
				{/if}
			</header>

			<!-- Two columns: Projects (compact) + Recent activity (tall, detailed) -->
			<div class="grid grid-cols-1 md:grid-cols-[1fr_1.4fr] gap-4 items-start">

				<!-- Projects -->
				<section class="rounded-sm border border-white/8 bg-white/3 p-4">
					<h2 class="text-sm font-semibold text-white/50 uppercase tracking-wider mb-3">Projects</h2>
					<div class="grid grid-cols-1 gap-2.5">
						{#each visibleRepos as repo}
							<a href={repo.html_url} target="_blank" rel="noopener"
								class="block rounded-sm border border-white/8 bg-white/3 p-3 hover:border-white/20 transition-all group">
								<div class="flex items-start justify-between gap-2">
									<span class="font-medium text-sm truncate transition-colors group-hover:[color:var(--accent)]" style="color:#e6edf3">{repo.name}</span>
									<span class="text-[10px] text-white/30 shrink-0">{rel(repo.updated_at)}</span>
								</div>
								{#if repo.description}
									<p class="text-xs text-white/50 mt-1 line-clamp-2 leading-snug">{repo.description}</p>
								{/if}
								<div class="flex items-center gap-3 mt-2 text-[11px] text-white/40">
									{#if repo.language}
										<span class="inline-flex items-center gap-1">
											<span class="w-2 h-2 rounded-full" style="background:{langColor(repo.language)}"></span>
											{repo.language}
										</span>
									{/if}
									{#if repo.stargazers_count > 0}
										<span class="inline-flex items-center gap-0.5">
											<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3l2.6 5.6 6 .8-4.4 4.2 1.1 6-5.3-3-5.3 3 1.1-6L3.4 9.4l6-.8z"/></svg>
											{repo.stargazers_count}
										</span>
									{/if}
									{#if repo.forks_count > 0}
										<span class="inline-flex items-center gap-0.5">
											<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="12" cy="18" r="2.5"/><path stroke-width="2" d="M6 8.5c0 4 6 3 6 7M18 8.5c0 4-6 3-6 7"/></svg>
											{repo.forks_count}
										</span>
									{/if}
								</div>
							</a>
						{/each}
					</div>
					{#if otherRepos.length > 6}
						<div class="text-center mt-3">
							<button onclick={() => (showAll = !showAll)}
								class="text-xs text-white/60 hover:text-white border border-white/10 hover:border-white/20 rounded-sm px-3.5 py-1.5 transition-all">
								{showAll ? 'Show fewer' : `Show all ${otherRepos.length} repos`}
							</button>
						</div>
					{/if}
				</section>

				<!-- Recent activity -->
				<section class="rounded-sm border border-white/8 bg-white/3 p-4">
					<h2 class="text-sm font-semibold text-white/50 uppercase tracking-wider mb-3">Recent Activity</h2>
					{#if activity.length > 0}
						<div class="flex flex-col gap-3">
							{#each activity as a}
								<div class="flex gap-2.5">
									<svg class="w-4 h-4 mt-0.5 shrink-0" style="color:var(--accent)" fill="currentColor" viewBox="0 0 24 24">{@html ICONS[a.icon] ?? ICONS.commit}</svg>
									<div class="min-w-0 text-xs leading-snug">
										<span class="text-white/80">{a.action}</span>
										{#if a.repo}<span class="[color:var(--accent)]"> {a.repo}</span>{/if}
										{#if a.count && a.count > 1}<span class="text-white/30"> ×{a.count}</span>{/if}
										{#if a.detail}<div class="text-white/40 truncate mt-0.5">{a.detail}</div>{/if}
										<span class="text-white/25">· {rel(a.created_at)}</span>
									</div>
								</div>
							{/each}
						</div>
					{:else}
						<p class="text-xs text-white/30">No recent public activity.</p>
					{/if}

					<!-- Background detail for the repos touched above -->
					{#if activeDetails.length > 0}
						<div class="mt-4 pt-4 border-t border-white/8">
							<h3 class="text-[11px] font-semibold text-white/40 uppercase tracking-wider mb-2.5">In these repos</h3>
							<div class="flex flex-col gap-2.5">
								{#each activeDetails as d}
									<div class="rounded-sm border border-white/8 bg-white/3 p-3">
										<div class="flex items-start justify-between gap-2">
											<a href={d.html_url} target="_blank" rel="noopener"
												class="font-medium text-sm [color:var(--accent)] truncate hover:underline">{d.external ? d.full : d.name}</a>
											<div class="flex items-center gap-2 shrink-0 text-[10px] text-white/30">
												{#if d.external}<span class="px-1.5 py-0.5 rounded bg-white/5 text-white/40">starred</span>{/if}
												{#if d.updated_at}<span>{rel(d.updated_at)}</span>{/if}
											</div>
										</div>
										{#if d.description}<p class="text-xs text-white/50 mt-1 leading-snug">{d.description}</p>{/if}
										{#if d.langs.length > 0}
											<span class="flex h-1.5 rounded-full overflow-hidden bg-white/5 mt-2.5">
												{#each d.langs.slice(0, 6) as l}<span style="width:{l.pct}%; background:{langColor(l.name)}"></span>{/each}
											</span>
											<div class="flex flex-wrap gap-x-2.5 gap-y-1 mt-1.5 text-[10px] text-white/45">
												{#each d.langs.slice(0, 4) as l}
													<span class="inline-flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full" style="background:{langColor(l.name)}"></span>{l.name} {Math.round(l.pct) || '<1'}%</span>
												{/each}
											</div>
										{/if}
										{#if d.stargazers_count > 0 || d.forks_count > 0}
											<div class="flex items-center gap-3 mt-2 text-[10px] text-white/35">
												{#if d.stargazers_count > 0}<span class="inline-flex items-center gap-0.5"><svg class="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3l2.6 5.6 6 .8-4.4 4.2 1.1 6-5.3-3-5.3 3 1.1-6L3.4 9.4l6-.8z"/></svg>{d.stargazers_count}</span>{/if}
												{#if d.forks_count > 0}<span class="inline-flex items-center gap-0.5"><svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="12" cy="18" r="2.5"/><path stroke-width="2" d="M6 8.5c0 4 6 3 6 7M18 8.5c0 4-6 3-6 7"/></svg>{d.forks_count}</span>{/if}
											</div>
										{/if}
									</div>
								{/each}
							</div>
						</div>
					{/if}
				</section>

			</div>
		</div>
	{:else if rateLimited}
		<section class="flex flex-col items-center justify-center px-4 pt-20 pb-8 text-center gap-2">
			<p class="text-white/60">GitHub's API rate limit was reached.</p>
			<p class="text-sm text-white/35">This page reads live data from the public GitHub API (60 requests/hour per IP, unauthenticated). Please try again in a few minutes.</p>
		</section>
	{:else}
		<section class="flex flex-col items-center justify-center px-4 pt-12 pb-8 text-center">
			<p class="text-white/50">User not found</p>
		</section>
	{/if}

	<footer class="text-center text-sm text-white/25 pb-6 mt-auto">
		<a href="https://svelte.dev" class="inline-flex items-center gap-2 hover:text-white/50 transition-colors">
			<img src="{base}/svelte1.png" alt="Svelte" class="h-4 w-4 opacity-40 hover:opacity-70 transition-opacity" />
			Built with Svelte
		</a>
	</footer>
</main>
