/** A day of the week, Monday first. */
export type Weekday = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

/** The week, Monday first. */
export const WEEKDAYS: readonly Weekday[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

/** The window a plugin can test against. */
export type QuietWindow = { start: string; end: string; days: readonly string[] };

/**
 * @description Reads a 24-hour time as minutes past midnight.
 * @param text The time, such as `22:00`.
 * @returns The minutes, or `undefined` when the text is not a time.
 */
export function parseClock(text: string): number | undefined {
	const match = /^(\d{1,2}):(\d{2})$/.exec(text.trim());

	if (!match) return undefined;

	const hours = Number(match[1]);
	const minutes = Number(match[2]);

	if (hours > 23 || minutes > 59) return undefined;

	return hours * 60 + minutes;
}

/**
 * @description Reads the day of the week a moment falls on, Monday first.
 * @param date The moment.
 * @returns The day.
 */
export function weekdayOf(date: Date): Weekday {
	return WEEKDAYS[(date.getDay() + 6) % 7]!;
}

/**
 * @description Tells whether a moment is inside the window. A window whose end is at or before its start crosses
 * midnight, and counts the day it started on.
 * @param now The moment.
 * @param window The start and end times, and the days the window starts on.
 * @returns Whether the moment is inside the window.
 */
export function isQuietAt(now: Date, window: QuietWindow): boolean {
	const from = parseClock(window.start);
	const to = parseClock(window.end);

	if (from === undefined || to === undefined || from === to) return false;

	const minutes = now.getHours() * 60 + now.getMinutes();

	if (from < to) {
		return minutes >= from && minutes < to && window.days.includes(weekdayOf(now));
	}

	if (minutes >= from) return window.days.includes(weekdayOf(now));

	const previous = new Date(now);

	previous.setDate(previous.getDate() - 1);

	return minutes < to && window.days.includes(weekdayOf(previous));
}
