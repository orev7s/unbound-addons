import { native } from '@unbound-app/api';

import { notifyOnAndroid } from '~/native/android/notify';
import { notifyOnIOS } from '~/native/ios/notify';

/**
 * @description Posts a local notification for a due reminder: on iOS at once, on Android as a no-op.
 */
export const notify = native.definePlatform({ ios: notifyOnIOS, android: notifyOnAndroid });

export default notify;
