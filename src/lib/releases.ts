// Release data shared between the build-time fetch (releases.server.ts) and the
// downloads page script. Keep this module free of Node APIs so it can also be
// bundled for the browser.
export const RELEASES_API = 'https://api.github.com/repos/etjump/etjump/releases?per_page=100';

/** Tag used for the rolling development build. */
export const DEV_TAG = 'latest';

export interface GithubAsset {
	name: string;
	browser_download_url: string;
	size: number;
}

export interface GithubRelease {
	tag_name: string;
	name: string | null;
	html_url: string;
	published_at: string | null;
	prerelease: boolean;
	draft: boolean;
	assets: GithubAsset[];
}

export interface Release {
	tag: string;
	title: string;
	url: string;
	downloadUrl: string | null;
	assetName: string | null;
	size: number | null;
	publishedAt: string | null;
	prerelease: boolean;
}

export interface ReleaseData {
	stable: Release;
	dev: Release | null;
	older: Release[];
}

export interface ReleaseSelection {
	stable: Release | null;
	dev: Release | null;
	older: Release[];
}

export const toRelease = (raw: GithubRelease): Release => {
	const asset = raw.assets.find((candidate) => candidate.name.endsWith('.zip')) ?? raw.assets[0] ?? null;

	return {
		tag: raw.tag_name,
		title: raw.name ?? raw.tag_name,
		url: raw.html_url,
		downloadUrl: asset?.browser_download_url ?? null,
		assetName: asset?.name ?? null,
		size: asset?.size ?? null,
		publishedAt: raw.published_at,
		prerelease: raw.prerelease || raw.draft,
	};
};

/** Split the release list into the stable, rolling dev build and everything older. */
export const selectReleases = (releases: Release[]): ReleaseSelection => {
	const dev = releases.find((release) => release.tag === DEV_TAG) ?? null;
	const stableReleases = releases.filter((release) => release.tag !== DEV_TAG && !release.prerelease);
	const stable = stableReleases[0] ?? null;

	return {
		stable,
		dev,
		older: stableReleases.filter((release) => release.tag !== stable?.tag),
	};
};

export const formatReleaseDate = (date: string | null): string | null =>
	date
		? new Date(date).toLocaleDateString('en-us', {
				year: 'numeric',
				month: 'short',
				day: 'numeric',
			})
		: null;

export const formatSize = (bytes: number | null): string | null => {
	if (!bytes) return null;

	const megabytes = bytes / 1_048_576;
	return `${megabytes.toFixed(megabytes >= 10 ? 0 : 1)} MB`;
};

/** `etjump-3.6.2-132-ga7663c3a.zip` -> `3.6.2-132-ga7663c3a` */
export const buildLabel = (assetName: string | null): string | null =>
	assetName ? assetName.replace(/^etjump-/, '').replace(/\.zip$/i, '') : null;
