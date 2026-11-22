import type { NativeBridge, NativeJavaValue } from '@unbound-app/api/native';
import { javaInt } from '@v80q/plugin-shared/native/android/java-values';

import type { BoostRequest } from '~/lib/gain';

const LOUDNESS_ENHANCER = 'android.media.audiofx.LoudnessEnhancer';
const ENABLED: NativeJavaValue = { type: 'boolean', value: true };

/**
 * @description Attaches a `LoudnessEnhancer` to the audio session and sets the target gain.
 * The class and method are looked up through the Java bridge behind a guard, so a build without the
 * effect is one warning, not a crash.
 * @param native The plugin's native bridge.
 * @param request The session and gain, in millibels.
 */
export async function boostOnAndroid(native: NativeBridge, request: BoostRequest): Promise<void> {
	const { java } = native;

	try {
		const enhancer = java.construct(LOUDNESS_ENHANCER, [javaInt(request.sessionId)]);

		java.invoke(enhancer, 'setTargetGain', [javaInt(request.millibels)]);
		java.invoke(enhancer, 'setEnabled', [ENABLED]);
	} catch (error) {
		logger.warn('Volume booster skipped: Android has no LoudnessEnhancer on this build.', error);
	}
}
