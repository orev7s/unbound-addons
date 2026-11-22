import { flux, storage } from '@unbound-app/api';
import { settings } from '@unbound-app/settings';

import {
	idleDecision,
	parseClock,
	type DayWindow,
	type IdleConfig,
	type IdleStatus,
} from '~/lib/decision';
import { readStatus, writeStatus } from '~/lib/presence';

const CHECK_INTERVAL_MS = 15_000;

type Applied = { status: IdleStatus; previous: string | undefined };

let applied: Applied | null = null;
let lastActivityAt = 0;
let backgrounded = false;
let timer: ReturnType<typeof setInterval> | undefined;
let unlisten: (() => void)[] = [];

function windowOf(enabled: boolean, start: string, end: string): DayWindow | null {
	const from = parseClock(start);
	const to = parseClock(end);

	return enabled && from !== null && to !== null ? { start: from, end: to } : null;
}

function config(): IdleConfig {
	const quiet = windowOf(
		settings.quietHours.enabled,
		settings.quietHours.start,
		settings.quietHours.end,
	);

	return {
		enabled: settings.enabled,
		targetStatus: settings.targetStatus,
		idleDelayMs: settings.idleDelay,
		onlyWhenBackgrounded: settings.onlyWhenBackgrounded,
		onlyWhenNotInVoice: settings.onlyWhenNotInVoice,
		excludeWhileActivityRunning: settings.excludeWhileActivityRunning,
		activeHours: windowOf(
			settings.activeHours.enabled,
			settings.activeHours.start,
			settings.activeHours.end,
		),
		quietHours: quiet ? { ...quiet, status: settings.quietHours.status } : null,
	};
}

function inVoice(): boolean {
	// The store is lazy; a build that moved it reads as absent.
	try {
		return Boolean(flux.getStore('SelectedChannel').getVoiceChannelId());
	} catch {
		return false;
	}
}

function activityRunning(): boolean {
	try {
		const store = flux.getStore('SelfPresence') as unknown as {
			getActivities?: () => unknown[];
		};

		return Boolean(store.getActivities?.()?.length);
	} catch {
		return false;
	}
}

function myId(): string | undefined {
	try {
		return flux.getStore('User').getCurrentUser()?.id;
	} catch {
		return undefined;
	}
}

/** Applies the status the settings and the current state call for, or restores the previous one. */
function sync(): void {
	const { status } = idleDecision(config(), {
		now: Date.now(),
		lastActivityAt,
		backgrounded,
		inVoice: inVoice(),
		activityRunning: activityRunning(),
	});

	if (status) {
		if (applied?.status === status) return;

		const previous = applied?.previous ?? readStatus();

		if (writeStatus(status)) applied = { status, previous };

		return;
	}

	if (!applied) return;

	if (writeStatus(applied.previous ?? 'online')) applied = null;
}

export function start() {
	applied = null;
	backgrounded = false;
	lastActivityAt = Date.now();

	unlisten = [
		flux.onAction('APP_STATE_UPDATE', ({ state }) => {
			backgrounded = state !== 'active';

			if (!backgrounded) lastActivityAt = Date.now();

			sync();
		}),
		flux.onAction('MESSAGE_CREATE', ({ message }) => {
			if (!settings.resetOnMessage) return;
			if (message.author?.id !== myId()) return;

			lastActivityAt = Date.now();
			sync();
		}),
		storage.onChange(({ store }) => store === addon.id, sync),
	];

	timer = setInterval(sync, CHECK_INTERVAL_MS);

	sync();
}

export function stop() {
	if (timer) clearInterval(timer);

	timer = undefined;

	for (const off of unlisten) off();

	unlisten = [];

	if (applied) {
		writeStatus(applied.previous ?? 'online');
		applied = null;
	}
}
