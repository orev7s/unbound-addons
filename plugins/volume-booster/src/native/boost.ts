import { native } from '@unbound-app/api';

import { boostOnAndroid as android } from '~/native/android/boost';
import { boostOnIOS as ios } from '~/native/ios/boost';

/**
 * @description Applies the requested boost: a `LoudnessEnhancer` on Android, a no-op on iOS.
 */
export const applyBoost = native.definePlatform({ ios, android });
