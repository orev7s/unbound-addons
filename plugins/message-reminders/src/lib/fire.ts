import { flux, metro, toasts } from '@unbound-app/api';
import type { NativeBridge } from '@unbound-app/api/native';
import { format, messages } from '@unbound-app/i18n';
import { settings } from '@unbound-app/settings';

import type { Reminder } from '~/lib/reminders';
import { notify } from '~/native/remind';

type MessageActions = {
	jumpToMessage?: (options: { channelId: string; messageId: string; flash?: boolean }) => void;
};

function channelName(channelId: string): string {
	return flux.getStore('Channel').getChannel(channelId)?.name || channelId;
}

function isBackgrounded(): boolean {
	return metro.common.ReactNative.AppState.currentState !== 'active';
}

/**
 * @description Opens the message a reminder is about.
 * @param reminder The reminder.
 */
export function openMessage(reminder: Reminder): void {
	const Messages = metro.api.Messages as MessageActions | undefined;

	if (typeof Messages?.jumpToMessage !== 'function') {
		logger.warn('Message reminder skipped: Discord moved MessageActions.jumpToMessage.');
		toasts.show({ title: addon.name, content: messages.REMIND_FAILED });

		return;
	}

	Messages.jumpToMessage({
		channelId: reminder.channelId,
		messageId: reminder.messageId,
		flash: true,
	});
}

/**
 * @description Tells the user a reminder is due: a toast with a button that opens the message, and a system
 * notification too when Discord is in the background.
 * @param getBridge Reads the plugin's native bridge.
 * @param reminder The reminder that came due.
 */
export function announceReminder(getBridge: () => NativeBridge, reminder: Reminder): void {
	const body = format('REMINDER_DUE', { channel: channelName(reminder.channelId) });

	toasts.show({
		title: messages.REMINDER_TITLE,
		content: body,
		buttons: [{ content: messages.OPEN, onPress: () => openMessage(reminder) }],
	});

	if (!settings.notify || !isBackgrounded()) return;

	try {
		notify(getBridge(), messages.REMINDER_TITLE, body);
	} catch (error) {
		logger.warn('Message reminder notification skipped:', error);
	}
}

export default announceReminder;
