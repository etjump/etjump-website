import { CURRENT_VERSION, CURRENT_VERSION_DOWNLOAD, GITHUB_URL } from '../consts';
import { RELEASES_API, selectReleases, toRelease, type GithubRelease, type ReleaseData } from './releases';

// Releases are read from the GitHub API at build time. The downloads page also
// refreshes them in the browser, but this snapshot is what no-JS visitors and
// crawlers see, and it keeps the stable download working when GitHub is
// unreachable. A GITHUB_TOKEN is optional but raises the rate limit in CI.

// If GitHub is unreachable the page still needs a working primary download.
const fallbackData = (): ReleaseData => ({
	stable: {
		tag: CURRENT_VERSION,
		title: `ETJump ${CURRENT_VERSION}`,
		url: `${GITHUB_URL}/releases/tag/${CURRENT_VERSION}`,
		downloadUrl: CURRENT_VERSION_DOWNLOAD,
		assetName: CURRENT_VERSION_DOWNLOAD.split('/').pop() ?? null,
		size: null,
		publishedAt: null,
		prerelease: false,
	},
	dev: null,
	older: [],
});

export async function getReleaseData(): Promise<ReleaseData> {
	const token = process.env.GITHUB_TOKEN;
	const headers: Record<string, string> = { Accept: 'application/vnd.github+json' };
	if (token) headers.Authorization = `Bearer ${token}`;

	try {
		const response = await fetch(RELEASES_API, { headers });
		if (!response.ok) throw new Error(`GitHub responded ${response.status}`);

		const selection = selectReleases(((await response.json()) as GithubRelease[]).map(toRelease));

		return {
			stable: selection.stable ?? fallbackData().stable,
			dev: selection.dev,
			older: selection.older,
		};
	} catch (error) {
		console.warn(`[downloads] Could not load GitHub releases: ${error}`);
		return fallbackData();
	}
}

// Cache per process: the dev server re-renders on every request but the release
// list only needs to be fetched once per session.
let cached: Promise<ReleaseData> | null = null;

export const loadReleaseData = (): Promise<ReleaseData> => (cached ??= getReleaseData());
