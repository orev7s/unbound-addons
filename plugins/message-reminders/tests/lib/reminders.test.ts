import { describe, expect, test } from 'bun:test';

import {
	dueReminders,
	isReminder,
	parseReminders,
	presetDue,
	type Reminder,
} from '~/lib/reminders';

const NOW = new Date('2026-12-24T12:00:00');

function reminder(id: string, due: number): Reminder {
	return { id, channelId: '1', messageId: id, due };
}

describe('presetDue', () => {
	test('adds the fixed delays', () => {
		expect(presetDue('10m', NOW)).toBe(NOW.getTime() + 600_000);
		expect(presetDue('1h', NOW)).toBe(NOW.getTime() + 3_600_000);
		expect(presetDue('3h', NOW)).toBe(NOW.getTime() + 10_800_000);
	});

	test('tomorrow is nine in the morning the next day', () => {
		const expected = new Date(NOW.getTime());

		expected.setDate(expected.getDate() + 1);
		expected.setHours(9, 0, 0, 0);

		expect(presetDue('tomorrow', NOW)).toBe(expected.getTime());
	});
});

describe('isReminder', () => {
	test('takes a reminder and turns away anything else', () => {
		expect(isReminder(reminder('a', 1))).toBe(true);
		expect(isReminder({ id: 'a', channelId: '1', messageId: 'a' })).toBe(false);
		expect(isReminder({ ...reminder('a', 1), due: Number.NaN })).toBe(false);
		expect(isReminder(null)).toBe(false);
		expect(isReminder('nope')).toBe(false);
	});
});

describe('parseReminders', () => {
	test('keeps reminders and drops anything else, soonest first', () => {
		expect(parseReminders([reminder('b', 200), { junk: true }, reminder('a', 100), null])).toEqual([
			reminder('a', 100),
			reminder('b', 200),
		]);
	});

	test('reads a missing or non-list value as empty', () => {
		expect(parseReminders(undefined)).toEqual([]);
		expect(parseReminders('nope')).toEqual([]);
	});
});

describe('dueReminders', () => {
	test('splits the ones due now from the rest, keeping order', () => {
		const { due, rest } = dueReminders(
			[reminder('a', 100), reminder('b', 200), reminder('c', 300)],
			200,
		);

		expect(due).toEqual([reminder('a', 100), reminder('b', 200)]);
		expect(rest).toEqual([reminder('c', 300)]);
	});
});
