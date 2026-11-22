import { patcher } from '@unbound-app/api';
import type { NativeBridge, PluginContext } from '@unbound-app/api/native';

import { announceReminder } from '~/lib/fire';
import { dueReminders } from '~/lib/reminders';
import { readReminders, writeReminders } from '~/lib/store';
import { patchActionSheets } from '~/patches';

const CHECK_INTERVAL_MS = 30_000;

/**
 * @description Announces every reminder that is due, dropping each from the list first so a failure never repeats one.
 * @param getBridge Reads the plugin's native bridge.
 */
function flush(getBridge: () => NativeBridge): void {
	const { due, rest } = dueReminders(readReminders(), Date.now());

	if (!due.length) return;

	writeReminders(rest);

	for (const reminder of due) announceReminder(getBridge, reminder);
}

export function start(context: PluginContext) {
	patchActionSheets();

	const getBridge = () => context.native;

	setInterval(() => flush(getBridge), CHECK_INTERVAL_MS);

	try {
		unbound.background?.add('message-reminders', () => flush(getBridge));
	} catch (error) {
		logger.warn('Message reminders will only fire while Discord is open:', error);
	}
}

export function stop() {
	patcher.unpatchAll();
}
