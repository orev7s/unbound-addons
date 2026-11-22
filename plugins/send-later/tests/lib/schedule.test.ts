import { describe, expect, test } from 'bun:test';

import { parseWhen } from '~/lib/schedule';

const NOW = new Date('2026-12-24T12:00:00');

function atNow(hours: number, minutes: number): Date {
	const moment = new Date(NOW.getTime());

	moment.setHours(hours, minutes, 0, 0);

	return moment;
}

describe('parseWhen', () => {
	test('reads a delay', () => {
		expect(parseWhen('2h', NOW)?.getTime()).toBe(NOW.getTime() + 7_200_000);
		expect(parseWhen('in 30 minutes', NOW)?.getTime()).toBe(NOW.getTime() + 1_800_000);
		expect(parseWhen('45s', NOW)?.getTime()).toBe(NOW.getTime() + 45_000);
		expect(parseWhen('3 days', NOW)?.getTime()).toBe(NOW.getTime() + 259_200_000);
	});

	test('reads a clock time today, or tomorrow once it has passed', () => {
		expect(parseWhen('18:30', NOW)?.getTime()).toBe(atNow(18, 30).getTime());

		const tomorrow = atNow(9, 0);

		tomorrow.setDate(tomorrow.getDate() + 1);

		expect(parseWhen('09:00', NOW)?.getTime()).toBe(tomorrow.getTime());
	});

	test('reads a date and time', () => {
		expect(parseWhen('2026-12-25 10:00', NOW)?.getTime()).toBe(
			new Date('2026-12-25T10:00:00').getTime(),
		);
	});

	test('rejects anything else, and a time that is not ahead', () => {
		expect(parseWhen('banana', NOW)).toBeUndefined();
		expect(parseWhen('0s', NOW)).toBeUndefined();
		expect(parseWhen('25:00', NOW)).toBeUndefined();
		expect(parseWhen('2020-01-01 10:00', NOW)).toBeUndefined();
	});
});
