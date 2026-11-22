import { storage } from '@unbound-app/api';

import { newReminder, parseReminders, type Reminder } from '~/lib/reminders';

const REMINDERS_KEY = 'reminders';

function bucket() {
	return storage.getBucket();
}

/** Reads the saved reminders, soonest first. */
export function readReminders(): Reminder[] {
	return parseReminders(bucket().get(REMINDERS_KEY, []));
}

/** Saves the reminders. */
export function writeReminders(list: readonly Reminder[]): void {
	bucket().set(REMINDERS_KEY, list as never);
}

/**
 * @description Adds a reminder for a message to the saved list.
 * @param channelId The channel the message is in.
 * @param messageId The message.
 * @param due The due time.
 * @returns The saved reminder.
 */
export function addReminder(channelId: string, messageId: string, due: number): Reminder {
	const reminder = newReminder(channelId, messageId, due);

	writeReminders([...readReminders(), reminder]);

	return reminder;
}
