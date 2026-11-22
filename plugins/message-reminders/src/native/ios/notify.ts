import type { NativeBridge, NativeObjectHandle } from '@unbound-app/api/native';

const REQUEST_ID = 'unbound-message-reminder';

/**
 * @description Posts a local notification at once, so a due reminder is seen while Discord is in the background.
 * @param native The plugin's native bridge.
 * @param title The notification's title.
 * @param body The notification's body.
 */
export function notifyOnIOS({ objc }: NativeBridge, title: string, body: string): void {
	const center = objc.call(
		objc.getClass('UNUserNotificationCenter')!,
		'currentNotificationCenter',
	) as NativeObjectHandle;
	const content = objc.create('UNMutableNotificationContent', 'init', []) as NativeObjectHandle;

	objc.invoke(content, 'setTitle:', [title]);
	objc.invoke(content, 'setBody:', [body]);
	objc.invoke(content, 'setSound:', [
		objc.call(objc.getClass('UNNotificationSound')!, 'defaultSound'),
	]);

	const request = objc.call(
		objc.getClass('UNNotificationRequest')!,
		'requestWithIdentifier:content:trigger:',
		REQUEST_ID,
		content,
		null,
	);

	objc.invoke(center, 'addNotificationRequest:withCompletionHandler:', [request, null]);
}

export default notifyOnIOS;
