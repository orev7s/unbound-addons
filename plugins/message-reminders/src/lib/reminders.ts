/** A reminder to look at a message again. */
export type Reminder = {
	id: string;
	channelId: string;
	messageId: string;
	due: number;
};

/** One of the delays the preset sheet offers. */
export type PresetId = '10m' | '1h' | '3h' | 'tomorrow';

/** The presets, in the order the sheet lists them. */
export const PRESETS: readonly PresetId[] = ['10m', '1h', '3h', 'tomorrow'];

const DELAY_MS: Record<'10m' | '1h' | '3h', number> = {
	'10m': 10 * 60_000,
	'1h': 3_600_000,
	'3h': 3 * 3_600_000,
};

const MORNING_HOUR = 9;

/**
 * @description Works out when a preset is due: a fixed delay from now, or nine in the morning tomorrow.
 * @param preset The preset.
 * @param now The current time.
 * @returns The due time, in milliseconds since the epoch.
 */
export function presetDue(preset: PresetId, now: Date = new Date()): number {
	if (preset !== 'tomorrow') return now.getTime() + DELAY_MS[preset];

	const date = new Date(now.getTime());

	date.setDate(date.getDate() + 1);
	date.setHours(MORNING_HOUR, 0, 0, 0);

	return date.getTime();
}

/**
 * @description Writes a due time the way the confirmation reads it, on the device's own clock.
 * @param due The due time.
 * @param locale The language to word it in.
 * @returns The time, such as `24/12, 18:30`.
 */
export function describeDue(due: number, locale?: string): string {
	return new Date(due).toLocaleString(locale, {
		day: '2-digit',
		month: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
	});
}

/**
 * @description Checks a stored value is a reminder, so one written by an older version never breaks reading.
 * @param value The stored value.
 * @returns Whether it is a reminder.
 */
export function isReminder(value: unknown): value is Reminder {
	if (typeof value !== 'object' || value === null) return false;

	const { id, channelId, messageId, due } = value as Record<string, unknown>;

	return (
		typeof id === 'string' &&
		typeof channelId === 'string' &&
		typeof messageId === 'string' &&
		typeof due === 'number' &&
		Number.isFinite(due)
	);
}

/**
 * @description Reads the reminders out of whatever is stored, dropping anything that is not one.
 * @param value The stored value.
 * @returns The reminders, soonest first.
 */
export function parseReminders(value: unknown): Reminder[] {
	if (!Array.isArray(value)) return [];

	return value.filter(isReminder).sort((left, right) => left.due - right.due);
}

/**
 * @description Splits reminders into the ones due now and the rest, in order.
 * @param list The reminders.
 * @param now The current time.
 * @returns The due reminders, and the ones still waiting.
 */
export function dueReminders(
	list: readonly Reminder[],
	now: number,
): { due: Reminder[]; rest: Reminder[] } {
	const due: Reminder[] = [];
	const rest: Reminder[] = [];

	for (const reminder of list) {
		(reminder.due <= now ? due : rest).push(reminder);
	}

	return { due, rest };
}

/**
 * @description Builds a reminder for a message.
 * @param channelId The channel the message is in.
 * @param messageId The message.
 * @param due The due time.
 * @returns The reminder.
 */
export function newReminder(channelId: string, messageId: string, due: number): Reminder {
	return {
		id: `${messageId}-${due.toString(36)}`,
		channelId,
		messageId,
		due,
	};
}

export default { PRESETS, describeDue, dueReminders, isReminder, newReminder, parseReminders, presetDue };
