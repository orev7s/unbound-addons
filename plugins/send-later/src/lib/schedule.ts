const RELATIVE = /^(?:in\s+)?(\d+(?:\.\d+)?)\s*(s|sec|secs|second|seconds|m|min|mins|minute|minutes|h|hr|hrs|hour|hours|d|day|days)$/i;
const CLOCK = /^(\d{1,2}):(\d{2})(?:\s*([ap])m)?$/i;

const UNIT_MS: Record<string, number> = {
	s: 1000,
	sec: 1000,
	secs: 1000,
	second: 1000,
	seconds: 1000,
	m: 60_000,
	min: 60_000,
	mins: 60_000,
	minute: 60_000,
	minutes: 60_000,
	h: 3_600_000,
	hr: 3_600_000,
	hrs: 3_600_000,
	hour: 3_600_000,
	hours: 3_600_000,
	d: 86_400_000,
	day: 86_400_000,
	days: 86_400_000,
};

function relative(text: string, now: Date): Date | undefined {
	const match = RELATIVE.exec(text.trim());

	if (!match) return undefined;

	const amount = Number(match[1]);
	const unit = UNIT_MS[match[2].toLowerCase()];

	if (!unit || !Number.isFinite(amount)) return undefined;

	return new Date(now.getTime() + amount * unit);
}

function clock(text: string, now: Date): Date | undefined {
	const match = CLOCK.exec(text.trim());

	if (!match) return undefined;

	let hours = Number(match[1]);
	const minutes = Number(match[2]);
	const half = match[3]?.toLowerCase();

	if (hours > 24 || minutes > 59 || (half && (hours < 1 || hours > 12))) return undefined;

	if (half === 'p' && hours !== 12) hours += 12;

	if (half === 'a' && hours === 12) hours = 0;

	const date = new Date(now.getTime());

	date.setHours(hours, minutes, 0, 0);

	if (date.getTime() <= now.getTime()) date.setDate(date.getDate() + 1);

	return date;
}

function absolute(text: string): Date | undefined {
	const parsed = new Date(text.trim().replace(' ', 'T'));

	return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

/**
 * @description Reads a time a message should be sent at: a delay such as `2h` or `in 30 minutes`,
 * a clock time such as `18:30`, or a date such as `2026-12-24 18:00`.
 * @param text The time the user typed.
 * @param now The current time.
 * @returns The moment, always in the future, or `undefined` when the text is not a time.
 */
export function parseWhen(text: string, now: Date = new Date()): Date | undefined {
	const moment = relative(text, now) ?? clock(text, now) ?? absolute(text);

	if (!moment || moment.getTime() <= now.getTime()) return undefined;

	return moment;
}

/**
 * @description Writes a moment the way the confirmation reads it, on the device's own clock.
 * @param moment The moment.
 * @param locale The language to word it in.
 * @returns The moment, such as `24/12/2026, 18:00`.
 */
export function describeWhen(moment: Date, locale?: string): string {
	return moment.toLocaleString(locale, {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	});
}
