import { metro, patcher } from '@unbound-app/api';
import { settings } from '@unbound-app/settings';

import { mediaKind, networkKind, shouldLoad, sourceUri, type NetworkState } from '~/lib/policy';

function deviceNetwork(): NetworkState | undefined {
	return globalThis.NativePlatform?.device?.getState?.()?.network;
}

/**
 * @description Stops media loading on mobile data, by patching React Native's image source resolver so it returns
 * no source when the policy says a URL should not load. The resolver runs on every image render, so a network
 * change takes effect on the next render without a listener.
 */
export function patchImageSources(): void {
	const { ImageSources } = metro.common;

	if (typeof ImageSources?.getImageSourcesFromImageProps !== 'function') {
		logger.warn('Media saver skipped: Discord moved ImageSources.');

		return;
	}

	patcher.instead(ImageSources, 'getImageSourcesFromImageProps', ({ args, original }) => {
		const uri = sourceUri(args[0]?.source);

		if (uri && !shouldLoad(mediaKind(uri), networkKind(deviceNetwork()), settings)) return null;

		return original(...args);
	});
}
