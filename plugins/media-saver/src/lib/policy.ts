/** The kind of media an image source holds. */
export type MediaKind = 'image' | 'gif' | 'video' | 'emoji' | 'sticker';

/** How the device is connected right now. */
export type NetworkKind = 'wifi' | 'metered' | 'lowData' | 'offline';

/** The device's connection, as `NativePlatform.device.getState()` reports it. */
export type NetworkState = { type?: string; metered?: boolean; lowData?: boolean };

/** The plugin's settings, read as the policy. */
export type MediaPolicy = {
	enabled: boolean;
	allowMetered: boolean;
	images: boolean;
	gifs: boolean;
	videos: boolean;
	emojis: boolean;
	stickers: boolean;
};

const KIND_SETTING: Record<MediaKind, keyof MediaPolicy> = {
	image: 'images',
	gif: 'gifs',
	video: 'videos',
	emoji: 'emojis',
	sticker: 'stickers',
};

/**
 * @description Reads the connection as one of four kinds: offline, a metered or cellular link, Low Data Mode, or wifi.
 * @param network The device's network state.
 * @returns The kind of connection.
 */
export function networkKind(network: NetworkState | undefined): NetworkKind {
	const type = network?.type;

	if (!type || type === 'offline') return 'offline';

	if (network?.lowData) return 'lowData';

	if (type === 'wifi' || type === 'ethernet') return network?.metered ? 'metered' : 'wifi';

	return 'metered';
}

/**
 * @description Reads a media kind from the URL Discord is about to load.
 * @param url The media URL.
 * @returns The kind, `image` when nothing else matches.
 */
export function mediaKind(url: string | undefined): MediaKind {
	const path = (url ?? '').split(/[?#]/)[0] ?? '';

	if (/\/stickers?\//i.test(path)) return 'sticker';
	if (/\/emojis?\//i.test(path)) return 'emoji';
	if (/\.gif$/i.test(path)) return 'gif';
	if (/\.(mp4|webm|mov|m4v)$/i.test(path)) return 'video';

	return 'image';
}

/**
 * @description Reads the URL of an `Image` source, ignoring a local asset, which never hits the network.
 * @param source The image source.
 * @returns The URL, or `undefined` for a local asset or no source.
 */
export function sourceUri(source: unknown): string | undefined {
	if (typeof source === 'string') return source;

	if (typeof source !== 'object' || source === null) return undefined;

	const uri = Reflect.get(source, 'uri');

	return typeof uri === 'string' ? uri : undefined;
}

/**
 * @description Decides whether media may load now. Wifi always loads; offline never does; on mobile data a
 * kind loads only when it is not restricted, or when the user allowed metered loading.
 * @param kind The media kind.
 * @param network The kind of connection.
 * @param policy The plugin's settings.
 * @returns Whether the media should load.
 */
export function shouldLoad(kind: MediaKind, network: NetworkKind, policy: MediaPolicy): boolean {
	if (!policy.enabled) return true;
	if (network === 'offline') return false;
	if (network === 'wifi') return true;
	if (policy.allowMetered) return true;

	return !policy[KIND_SETTING[kind]];
}
