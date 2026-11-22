import { metro } from '@unbound-app/api';

/** Discord's status setters, as the add-on needs them. */
type PresenceActions = {
	getStatus?: () => string;
	setStatus?: (status: string) => void;
};

// UNKNOWN: Discord's mobile status setter is undocumented; match a module holding both methods.
function presence(): PresenceActions | undefined {
	const module = metro.findByProps('setStatus', 'getStatus') as PresenceActions | undefined;

	return typeof module?.setStatus === 'function' ? module : undefined;
}

/**
 * @description Reads the status set now, to restore it later.
 * @returns The status, or `undefined` when Discord's setter is not where the add-on expects it.
 */
export function readStatus(): string | undefined {
	const value = presence()?.getStatus?.();

	return typeof value === 'string' ? value : undefined;
}

/**
 * @description Sets the user's status, guarding the lookup so a moved setter is one clear warning, not a crash.
 * @param status The status to set, such as `idle`.
 * @returns Whether the status was set.
 */
export function writeStatus(status: string): boolean {
	const actions = presence();

	if (!actions) {
		logger.warn('Custom idle skipped: Discord moved the status setter.');

		return false;
	}

	actions.setStatus!(status);

	return true;
}
