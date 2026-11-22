import { flux, logs, metro, startPlugin, stopPlugin } from '@unbound-app/api/testing';
import { settings } from '@unbound-app/settings';
import { afterEach, beforeEach, describe, expect, setSystemTime, test } from 'bun:test';

const START = new Date(2026, 5, 1, 10, 0, 0).getTime();
const MINUTE = 60_000;

let calls: string[] = [];
let current = 'online';

function registerPresence() {
	calls = [];
	current = 'online';

	metro.register({
		getStatus: () => current,
		setStatus: (status: string) => {
			calls.push(status);
			current = status;
		},
	});
}

async function idleInBackground() {
	setSystemTime(START + 6 * MINUTE);
	await flux.dispatch({ type: 'APP_STATE_UPDATE', state: 'background' });
}

beforeEach(() => {
	calls = [];
	current = 'online';
	setSystemTime(START);
});

afterEach(async () => {
	setSystemTime(new Date());

	try {
		await stopPlugin();
	} catch {
		// The test already stopped the plugin.
	}
});

describe('custom idle', () => {
	test('sets the chosen status once idle in the background', async () => {
		registerPresence();
		await startPlugin();
		await idleInBackground();

		expect(calls).toEqual(['idle']);
	});

	test('restores the previous status when you come back', async () => {
		registerPresence();
		await startPlugin();
		await idleInBackground();
		await flux.dispatch({ type: 'APP_STATE_UPDATE', state: 'active' });

		expect(calls).toEqual(['idle', 'online']);
	});

	test('leaves the status alone while Discord is in the foreground', async () => {
		registerPresence();
		await startPlugin();

		setSystemTime(START + 6 * MINUTE);
		await flux.dispatch({ type: 'APP_STATE_UPDATE', state: 'active' });

		expect(calls).toEqual([]);
	});

	test('does nothing while the add-on is off', async () => {
		registerPresence();
		settings.enabled = false;
		await startPlugin();
		await idleInBackground();

		expect(calls).toEqual([]);
	});

	test('honours a quiet-hours status at once', async () => {
		registerPresence();
		settings.quietHours.enabled = true;
		setSystemTime(new Date(2026, 5, 1, 23, 30, 0).getTime());
		await startPlugin();
		await flux.dispatch({ type: 'APP_STATE_UPDATE', state: 'background' });

		expect(calls).toEqual(['dnd']);
	});

	test('resets the delay when you send a message', async () => {
		registerPresence();
		flux.seed({ User: { getCurrentUser: () => ({ id: 'me' }) } });
		await startPlugin();
		await idleInBackground();

		await flux.dispatch({
			type: 'MESSAGE_CREATE',
			message: { author: { id: 'me' } },
		} as never);

		expect(calls).toEqual(['idle', 'online']);
	});

	test('warns once when Discord moved the status setter', async () => {
		await startPlugin();
		await idleInBackground();

		expect(
			logs.entries.some((entry) => String(entry.args[0]).includes('Custom idle skipped')),
		).toBe(true);
	});
});
