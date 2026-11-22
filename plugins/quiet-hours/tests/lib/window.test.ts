import { describe, expect, test } from 'bun:test';

import { quietNow, type QuietSettings } from '~/lib/apply';
import { isQuietAt, parseClock, weekdayOf } from '~/lib/window';

// 2026-01-01 is a Thursday; 01-02 Friday, 01-03 Saturday, 01-05 Monday, 01-06 Tuesday.
function at(day: number, hours: number, minutes: number): Date {
	return new Date(2026, 0, day, hours, minutes);
}

const EVERY_DAY = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

function window_(start: string, end: string, days: string[] = EVERY_DAY) {
	return { start, end, days };
}

describe('parseClock', () => {
	test('reads a 24-hour time', () => {
		expect(parseClock('00:00')).toBe(0);
		expect(parseClock('22:00')).toBe(1320);
		expect(parseClock('08:05')).toBe(485);
	});

	test('rejects anything else', () => {
		expect(parseClock('24:00')).toBeUndefined();
		expect(parseClock('9:5')).toBeUndefined();
		expect(parseClock('22:60')).toBeUndefined();
		expect(parseClock('bedtime')).toBeUndefined();
	});
});

describe('weekdayOf', () => {
	test('reads the day, Monday first', () => {
		expect(weekdayOf(at(1, 12, 0))).toBe('thu');
		expect(weekdayOf(at(3, 12, 0))).toBe('sat');
		expect(weekdayOf(at(5, 12, 0))).toBe('mon');
	});
});

describe('isQuietAt', () => {
	test('reads a window that stays inside one day', () => {
		const work = window_('09:00', '17:00');

		expect(isQuietAt(at(5, 12, 0), work)).toBe(true);
		expect(isQuietAt(at(5, 9, 0), work)).toBe(true);
		expect(isQuietAt(at(5, 8, 59), work)).toBe(false);
		expect(isQuietAt(at(5, 17, 0), work)).toBe(false);
	});

	test('reads a window that crosses midnight, counting its start day', () => {
		const night = window_('22:00', '08:00');

		expect(isQuietAt(at(2, 23, 0), night)).toBe(true);
		expect(isQuietAt(at(3, 7, 0), night)).toBe(true);
		expect(isQuietAt(at(3, 12, 0), night)).toBe(false);
		expect(isQuietAt(at(5, 21, 59), night)).toBe(false);
		expect(isQuietAt(at(5, 22, 0), night)).toBe(true);
	});

	test('follows the day the window starts on', () => {
		const mondayNight = window_('22:00', '08:00', ['mon']);

		expect(isQuietAt(at(5, 23, 0), mondayNight)).toBe(true);
		expect(isQuietAt(at(6, 7, 0), mondayNight)).toBe(true);
		expect(isQuietAt(at(6, 23, 0), mondayNight)).toBe(false);
		expect(isQuietAt(at(5, 7, 0), mondayNight)).toBe(false);
	});

	test('is never quiet with an empty or malformed window', () => {
		expect(isQuietAt(at(5, 23, 0), window_('22:00', '22:00'))).toBe(false);
		expect(isQuietAt(at(5, 23, 0), window_('soon', 'later'))).toBe(false);
	});
});

describe('quietNow', () => {
	function settings(overrides: Partial<QuietSettings> = {}): QuietSettings {
		return { enabled: true, targets: ['c1'], ...window_('22:00', '08:00'), ...overrides };
	}

	test('is quiet only with the plugin on and inside the window', () => {
		expect(quietNow(at(5, 23, 0), settings())).toBe(true);
		expect(quietNow(at(5, 12, 0), settings())).toBe(false);
		expect(quietNow(at(5, 23, 0), settings({ enabled: false }))).toBe(false);
	});
});
