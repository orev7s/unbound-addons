import { metro } from '@unbound-app/api';

import { isQuietAt, type QuietWindow } from '~/lib/window';

/** The plugin's settings that decide whether it is quiet now. */
export type QuietSettings = QuietWindow & { enabled: boolean; targets: readonly string[] };

type MuteActions = {
	updateChannelOverrideSettings?: (
		guildId: string,
		channelId: string,
		settings: { muted: boolean },
	) => void;
};

// Whether the targets are currently muted by this plugin.
let applied = false;

/**
 * @description Tells whether a moment is inside the window, with the plugin turned on.
 * @param now The moment.
 * @param settings The plugin's settings.
 * @returns Whether the window is active now.
 */
export function quietNow(now: Date, settings: QuietSettings): boolean {
	return settings.enabled && isQuietAt(now, settings);
}

/**
 * @description Mutes or unmutes the configured channels and servers, through Discord's channel override action.
 * @param ids The channel and server ids to change.
 * @param muted Whether to mute them.
 * @returns Whether Discord's action was found and called.
 */
export function setMuted(ids: readonly string[], muted: boolean): boolean {
	const actions = metro.findByProps('updateChannelOverrideSettings') as MuteActions | undefined;

	if (typeof actions?.updateChannelOverrideSettings !== 'function') {
		logger.warn('Quiet hours skipped: Discord moved the channel mute actions.');

		return false;
	}

	for (const id of ids) actions.updateChannelOverrideSettings(id, id, { muted });

	return true;
}

/**
 * @description Applies the window's state at a moment, muting when it opens and unmuting when it closes.
 * @param now The moment.
 * @param settings The plugin's settings.
 */
export function syncQuiet(now: Date, settings: QuietSettings): void {
	const quiet = quietNow(now, settings);

	if (quiet === applied) return;

	if (setMuted(settings.targets, quiet)) applied = quiet;
}

/** Forgets the last applied state, as on start. */
export function resetQuiet(): void {
	applied = false;
}
