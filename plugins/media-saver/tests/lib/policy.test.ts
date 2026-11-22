import { describe, expect, test } from 'bun:test';

import {
	mediaKind,
	networkKind,
	shouldLoad,
	sourceUri,
	type MediaPolicy,
} from '~/lib/policy';

const POLICY: MediaPolicy = {
	enabled: true,
	allowMetered: false,
	images: true,
	gifs: true,
	videos: true,
	emojis: false,
	stickers: false,
};

describe('networkKind', () => {
	test('reads wifi and ethernet as wifi', () => {
		expect(networkKind({ type: 'wifi' })).toBe('wifi');
		expect(networkKind({ type: 'ethernet' })).toBe('wifi');
	});

	test('reads cellular and a metered wifi link as metered', () => {
		expect(networkKind({ type: 'cellular' })).toBe('metered');
		expect(networkKind({ type: 'wifi', metered: true })).toBe('metered');
	});

	test('reads Low Data Mode and no connection', () => {
		expect(networkKind({ type: 'wifi', lowData: true })).toBe('lowData');
		expect(networkKind({ type: 'offline' })).toBe('offline');
		expect(networkKind(undefined)).toBe('offline');
	});
});

describe('mediaKind', () => {
	test('tells the CDN paths apart', () => {
		expect(mediaKind('https://cdn.discordapp.com/emojis/1.webp')).toBe('emoji');
		expect(mediaKind('https://cdn.discordapp.com/stickers/2.png')).toBe('sticker');
		expect(mediaKind('https://cdn.discordapp.com/attachments/1/2/cat.png')).toBe('image');
	});

	test('tells a GIF and a video by their extension, ignoring the query', () => {
		expect(mediaKind('https://cdn.discordapp.com/attachments/1/2/fun.gif?ex=1')).toBe('gif');
		expect(mediaKind('https://cdn.discordapp.com/attachments/1/2/clip.MP4')).toBe('video');
	});
});

describe('sourceUri', () => {
	test('reads a URI and ignores a local asset', () => {
		expect(sourceUri({ uri: 'https://x/y.png' })).toBe('https://x/y.png');
		expect(sourceUri('https://x/y.png')).toBe('https://x/y.png');
		expect(sourceUri(42)).toBeUndefined();
		expect(sourceUri(undefined)).toBeUndefined();
	});
});

describe('shouldLoad', () => {
	test('always loads on wifi, and never without a connection', () => {
		expect(shouldLoad('image', 'wifi', POLICY)).toBe(true);
		expect(shouldLoad('image', 'offline', POLICY)).toBe(false);
	});

	test('blocks the restricted kinds on mobile data, keeps the rest', () => {
		expect(shouldLoad('image', 'metered', POLICY)).toBe(false);
		expect(shouldLoad('video', 'metered', POLICY)).toBe(false);
		expect(shouldLoad('emoji', 'metered', POLICY)).toBe(true);
		expect(shouldLoad('sticker', 'lowData', POLICY)).toBe(true);
	});

	test('loads everything when metered loading is allowed', () => {
		expect(shouldLoad('image', 'metered', { ...POLICY, allowMetered: true })).toBe(true);
		expect(shouldLoad('video', 'lowData', { ...POLICY, allowMetered: true })).toBe(true);
	});

	test('loads everything when the plugin is off', () => {
		expect(shouldLoad('image', 'metered', { ...POLICY, enabled: false })).toBe(true);
	});
});
