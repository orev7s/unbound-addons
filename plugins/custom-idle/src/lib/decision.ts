/** The statuses this add-on can set. */
export type IdleStatus = 'idle' | 'dnd' | 'invisible';

/** A window of the day, in minutes since midnight; `start > end` crosses midnight. */
export type DayWindow = { start: number; end: number };

/** Everything the decision reads from the settings. */
export type IdleConfig = {
	enabled: boolean;
	targetStatus: IdleStatus;
	idleDelayMs: number;
	onlyWhenBackgrounded: boolean;
	onlyWhenNotInVoice: boolean;
	excludeWhileActivityRunning: boolean;
	activeHours: DayWindow | null;
	quietHours: (DayWindow & { status: IdleStatus }) | null;
};

/** Everything the decision reads from the app right now. */
export type IdleSituation = {
	now: number;
	lastActivityAt: number;
	backgrounded: boolean;
	inVoice: boolean;
	activityRunning: boolean;
};

/** Why the decision came out the way it did. */
export type IdleReason =
	| 'disabled'
	| 'outside-active-hours'
	| 'foreground'
	| 'in-voice'
	| 'activity-running'
	| 'waiting'
	| 'quiet-hours'
	| 'idle';

/** The status to show now, or `null` to leave the user's own status alone. */
export type IdleDecision = {
	status: IdleStatus | null;
	reason: IdleReason;
};

const CLOCK = /^(\d{1,2}):(\d{2})$/;

/**
 * @description Reads a `HH:MM` clock time as minutes since midnight.
 * @param text The text a setting holds, such as `22:00`.
 * @returns The minute, or `null` when the text is not a time.
 */
export function parseClock(text: string): number | null {
	const match = CLOCK.exec(text.trim());

	if (!match) return null;

	const hours = Number(match[1]);
	const minutes = Number(match[2]);

	if (hours > 23 || minutes > 59) return null;

	return hours * 60 + minutes;
}

/**
 * @description Reads the minute of the day a timestamp falls on, on the device's own clock.
 * @param now The timestamp, in milliseconds since the epoch.
 * @returns Minutes since midnight, 0 to 1439.
 */
export function minutesOfDay(now: number): number {
	const date = new Date(now);

	return date.getHours() * 60 + date.getMinutes();
}

/**
 * @description Tells whether a minute of the day is inside a window, wrapping past midnight when `start > end`.
 * @param window The window; its start counts, its end does not, and matching ends make it empty.
 * @param minutes The minute of the day.
 * @returns Whether the minute is inside.
 */
export function inDayWindow(window: DayWindow, minutes: number): boolean {
	return window.start <= window.end
		? minutes >= window.start && minutes < window.end
		: minutes >= window.start || minutes < window.end;
}

/**
 * @description Decides which status applies right now, from the settings and the current app state.
 * Quiet hours win over everything but the gates above them: they apply their own status at once.
 * @param config The settings.
 * @param situation The state now.
 * @returns The status to show and why, or `null` to leave the user's status alone.
 */
export function idleDecision(config: IdleConfig, situation: IdleSituation): IdleDecision {
	if (!config.enabled) return { status: null, reason: 'disabled' };

	const minute = minutesOfDay(situation.now);

	if (config.activeHours && !inDayWindow(config.activeHours, minute)) {
		return { status: null, reason: 'outside-active-hours' };
	}

	if (config.onlyWhenBackgrounded && !situation.backgrounded) {
		return { status: null, reason: 'foreground' };
	}

	if (config.onlyWhenNotInVoice && situation.inVoice) {
		return { status: null, reason: 'in-voice' };
	}

	if (config.excludeWhileActivityRunning && situation.activityRunning) {
		return { status: null, reason: 'activity-running' };
	}

	if (config.quietHours && inDayWindow(config.quietHours, minute)) {
		return { status: config.quietHours.status, reason: 'quiet-hours' };
	}

	if (situation.now - situation.lastActivityAt < config.idleDelayMs) {
		return { status: null, reason: 'waiting' };
	}

	return { status: config.targetStatus, reason: 'idle' };
}
