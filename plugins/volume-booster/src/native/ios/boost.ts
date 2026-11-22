import type { NativeBridge } from '@unbound-app/api/native';

import type { BoostRequest } from '~/lib/gain';

let noted = false;

/**
 * @description iOS offers no supported way to push audio past the system maximum, so this is a no-op.
 * The note is logged once rather than on every settings change.
 * @param _native The plugin's native bridge, unused on iOS.
 * @param _request The requested boost, unused on iOS.
 */
export async function boostOnIOS(_native: NativeBridge, _request: BoostRequest): Promise<void> {
	if (noted) return;

	noted = true;
	logger.info('Volume booster does nothing on iOS: there is no supported loudness effect.');
}
