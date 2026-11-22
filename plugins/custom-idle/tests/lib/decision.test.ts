import { describe, expect, test } from 'bun:test';

import {
	idleDecision,
	inDayWindow,
	minutesOfDay,
	parseClock,
	type IdleConfig,
	type IdleSituation,
} from '~/lib/decision';

const DELAY = 300_000;

function at(hours: number, minutes = 0): number {
	return new Date(2026, 5, 1, hours, minutes).getTime();
}

function config(overrides: Partial<IdleConfig> = {}): IdleConfig {
	return {
		enabled: true,
		targetStatus: 'idle',
		idleDelayMs: DELAY,
		onlyWhenBackgrounded: true,
		onlyWhenNotInVoice: true,
		excludeWhileActivityRunning: true,
		activeHours: null,
		quietHours: null,
		...overrides,
	};
}

function situation(overrides: Partial<IdleSituation> = {}): IdleSituation {
	return {
		now: at(10),
		lastActivityAt: at(10),
		backgrounded: true,
		inVoice: false,
		activityRunning: false,
		...overrides,
	};
}

describe('parseClock', () => {
	test('reads a clock time as minutes since midnight', () => {
		expect(parseClock('00:00')).toBe(0);
		expect(parseClock('09:30')).toBe(570);
		expect(parseClock('23:59')).toBe(1439);
		expect(parseClock(' 8:05 ')).toBe(485);
	});

	test('rejects anything that is not a time', () => {
		expect(parseClock('24:00')).toBeNull();
		expect(parseClock('12:60')).toBeNull();
		expect(parseClock('noon')).toBeNull();
		expect(parseClock('12')).toBeNull();
	});
});

describe('minutesOfDay', () => {
	test('reads the local minute of the timestamp', () => {
		expect(minutesOfDay(at(0, 0))).toBe(0);
		expect(minutesOfDay(at(13, 45))).toBe(825);
	});
});

describe('inDayWindow', () => {
	test('counts the start and not the end', () => {
		const window = { start: 540, end: 1020 };

		expect(inDayWindow(window, 540)).toBe(true);
		expect(inDayWindow(window, 1019)).toBe(true);
		expect(inDayWindow(window, 1020)).toBe(false);
		expect(inDayWindow(window, 539)).toBe(false);
	});

	test('wraps past midnight when the start is after the end', () => {
		const window = { start: 1320, end: 480 };

		expect(inDayWindow(window, 1380)).toBe(true);
		expect(inDayWindow(window, 120)).toBe(true);
		expect(inDayWindow(window, 720)).toBe(false);
	});

	test('is empty when the ends match', () => {
		expect(inDayWindow({ start: 600, end: 600 }, 600)).toBe(false);
	});
});

describe('idleDecision', () => {
	test('stays put while the add-on is off', () => {
		expect(idleDecision(config({ enabled: false }), situation())).toEqual({
			status: null,
			reason: 'disabled',
		});
	});

	test('applies the target status once the delay has passed', () => {
		expect(idleDecision(config(), situation({ lastActivityAt: at(10) - DELAY }))).toEqual({
			status: 'idle',
			reason: 'idle',
		});
	});

	test('counts the exact delay as elapsed', () => {
		expect(idleDecision(config(), situation({ lastActivityAt: at(10) - DELAY })).status).toBe(
			'idle',
		);
	});

	test('waits while the delay has not passed', () => {
		expect(
			idleDecision(config(), situation({ lastActivityAt: at(10) - DELAY + 1 })).reason,
		).toBe('waiting');
	});

	test('uses the chosen idle status', () => {
		const elapsed = { lastActivityAt: at(10) - DELAY };

		expect(idleDecision(config({ targetStatus: 'dnd' }), situation(elapsed)).status).toBe('dnd');
		expect(idleDecision(config({ targetStatus: 'invisible' }), situation(elapsed)).status).toBe(
			'invisible',
		);
	});

	test('leaves the status alone while Discord is in the foreground', () => {
		const elapsed = { lastActivityAt: at(10) - DELAY };
		const decision = idleDecision(config(), situation({ ...elapsed, backgrounded: false }));

		expect(decision).toEqual({ status: null, reason: 'foreground' });
	});

	test('ignores the foreground when the setting is off', () => {
		const decision = idleDecision(
			config({ onlyWhenBackgrounded: false }),
			situation({ backgrounded: false, lastActivityAt: at(10) - DELAY }),
		);

		expect(decision.status).toBe('idle');
	});

	test('leaves the status alone in a voice call', () => {
		const decision = idleDecision(
			config(),
			situation({ inVoice: true, lastActivityAt: at(10) - DELAY }),
		);

		expect(decision).toEqual({ status: null, reason: 'in-voice' });
	});

	test('ignores a voice call when the setting is off', () => {
		const decision = idleDecision(
			config({ onlyWhenNotInVoice: false }),
			situation({ inVoice: true, lastActivityAt: at(10) - DELAY }),
		);

		expect(decision.status).toBe('idle');
	});

	test('leaves the status alone while an activity runs', () => {
		const decision = idleDecision(
			config(),
			situation({ activityRunning: true, lastActivityAt: at(10) - DELAY }),
		);

		expect(decision).toEqual({ status: null, reason: 'activity-running' });
	});

	test('ignores an activity when the setting is off', () => {
		const decision = idleDecision(
			config({ excludeWhileActivityRunning: false }),
			situation({ activityRunning: true, lastActivityAt: at(10) - DELAY }),
		);

		expect(decision.status).toBe('idle');
	});

	test('stays inside the active hours', () => {
		const activeHours = { start: 540, end: 1020 };
		const elapsed = { lastActivityAt: at(11) - DELAY };

		expect(idleDecision(config({ activeHours }), situation({ ...elapsed, now: at(11) })).status).toBe(
			'idle',
		);
		expect(
			idleDecision(config({ activeHours }), situation({ ...elapsed, now: at(6, 30) })),
		).toEqual({ status: null, reason: 'outside-active-hours' });
	});

	test('checks active hours before quiet hours', () => {
		const decision = idleDecision(
			config({
				activeHours: { start: 540, end: 1020 },
				quietHours: { start: 0, end: 1439, status: 'dnd' },
			}),
			situation({ now: at(2), lastActivityAt: at(2) }),
		);

		expect(decision).toEqual({ status: null, reason: 'outside-active-hours' });
	});

	test('quiet hours apply their status at once', () => {
		const decision = idleDecision(
			config({ quietHours: { start: 1320, end: 480, status: 'invisible' } }),
			situation({ now: at(23, 30), lastActivityAt: at(23, 30) }),
		);

		expect(decision).toEqual({ status: 'invisible', reason: 'quiet-hours' });
	});

	test('quiet hours wrap past midnight', () => {
		const quietHours = { start: 1320, end: 480, status: 'dnd' as const };

		expect(idleDecision(config({ quietHours }), situation({ now: at(2) })).reason).toBe(
			'quiet-hours',
		);
		expect(
			idleDecision(config({ quietHours }), situation({ now: at(12), lastActivityAt: at(12) }))
				.reason,
		).toBe('waiting');
	});

	test('the gates still hold during quiet hours', () => {
		const quiet = { start: 0, end: 1439, status: 'dnd' as const };

		expect(
			idleDecision(config({ quietHours: quiet }), situation({ backgrounded: false })).reason,
		).toBe('foreground');
		expect(idleDecision(config({ quietHours: quiet }), situation({ inVoice: true })).reason).toBe(
			'in-voice',
		);
	});
});
