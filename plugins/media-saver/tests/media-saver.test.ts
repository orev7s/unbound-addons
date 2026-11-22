import { metro as discord } from '@unbound-app/api';
import { metro, startPlugin } from '@unbound-app/api/testing';
import { settings } from '@unbound-app/settings';
import { afterEach, beforeEach, describe, expect, test } from 'bun:test';

import type { NetworkState } from '~/lib/policy';

const IMAGE = 'https://cdn.discordapp.com/attachments/1/2/cat.png';
const EMOJI = 'https://cdn.discordapp.com/emojis/1.webp';

// React Native's image source resolver, as Discord bundles it: it hands the source straight back.
const sources = {
	getImageSourcesFromImageProps: (props: { source?: unknown }) => props.source,
};

function setNetwork(network: NetworkState | undefined): void {
	globalThis.NativePlatform = {
		device: { getState: () => ({ network }) },
	} as unknown as typeof globalThis.NativePlatform;
}

function resolve(uri: string): unknown {
	return discord.common.ImageSources.getImageSourcesFromImageProps({ source: { uri } });
}

beforeEach(async () => {
	metro.register(sources);
	await startPlugin();
});

afterEach(() => {
	globalThis.NativePlatform = undefined;
});

describe('media on mobile data', () => {
	test('keeps an image from loading on cellular', () => {
		setNetwork({ type: 'cellular' });

		expect(resolve(IMAGE)).toBeNull();
	});

	test('loads the same image on wifi', () => {
		setNetwork({ type: 'wifi' });

		expect(resolve(IMAGE)).not.toBeNull();
	});

	test('leaves emojis alone on cellular', () => {
		setNetwork({ type: 'cellular' });

		expect(resolve(EMOJI)).not.toBeNull();
	});

	test('loads everything once the plugin is turned off', () => {
		settings.enabled = false;
		setNetwork({ type: 'cellular' });

		expect(resolve(IMAGE)).not.toBeNull();
	});
});
