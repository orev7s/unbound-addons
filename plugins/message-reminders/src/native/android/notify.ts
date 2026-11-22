import type { NativeBridge } from '@unbound-app/api/native';

/**
 * @description Android reminders wait for Discord to be in front; a system notification needs a channel this plugin
 * does not create, so there is nothing to post here.
 * @param _bridge The plugin's native bridge, unused on Android.
 * @param _title The notification's title.
 * @param _body The notification's body.
 */
export function notifyOnAndroid(_bridge: NativeBridge, _title: string, _body: string): void {
	// No-op on Android.
}

export default notifyOnAndroid;
