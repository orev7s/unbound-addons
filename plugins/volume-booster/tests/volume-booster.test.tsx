import { logs, native, startPlugin, stopPlugin } from '@unbound-app/api/testing';
import { settings } from '@unbound-app/settings';
import { afterEach, describe, expect, test } from 'bun:test';

const ENHANCER = 'android.media.audiofx.LoudnessEnhancer';

function registerEnhancer() {
	native.java.registerClass(ENHANCER, {
		methods: {
			setTargetGain: () => undefined,
			setEnabled: () => undefined,
		},
	});
}

function gain(): unknown {
	return native.calls.find((call) => call.name === 'setTargetGain')?.args;
}

afterEach(async () => {
	try {
		await stopPlugin();
	} catch {
		// The test already stopped the plugin.
	}
});

describe('volume booster on Android', () => {
	test('attaches a LoudnessEnhancer with the chosen gain', async () => {
		native.setPlatform('android');
		registerEnhancer();
		settings.boostDb = 6;

		await startPlugin();

		expect(gain()).toEqual([{ type: 'int', value: 600 }]);
	});

	test('carries no boost when every source is off', async () => {
		native.setPlatform('android');
		registerEnhancer();
		settings.sources.voiceMessages = false;
		settings.sources.mediaAudio = false;

		await startPlugin();

		expect(gain()).toEqual([{ type: 'int', value: 0 }]);
	});

	test('carries no boost while the add-on is off', async () => {
		native.setPlatform('android');
		registerEnhancer();
		settings.enabled = false;

		await startPlugin();

		expect(gain()).toEqual([{ type: 'int', value: 0 }]);
	});

	test('warns and keeps going when Android has no loudness effect', async () => {
		native.setPlatform('android');

		await startPlugin();

		expect(
			logs.entries.some((entry) => String(entry.args[0]).includes('Volume booster skipped')),
		).toBe(true);
		expect(gain()).toBeUndefined();
	});
});

describe('volume booster on iOS', () => {
	test('does nothing and notes it once', async () => {
		native.setPlatform('ios');

		await startPlugin();

		expect(native.calls.some((call) => call.bridge === 'java')).toBe(false);
		expect(
			logs.entries.some((entry) => String(entry.args[0]).includes('does nothing on iOS')),
		).toBe(true);
	});
});
