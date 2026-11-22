import { storage } from '@unbound-app/api';
import type { NativeBridge, PluginContext } from '@unbound-app/api/native';
import { settings } from '@unbound-app/settings';

import {
	anySourceEnabled,
	boostMillibels,
	GLOBAL_AUDIO_SESSION,
	type BoostRequest,
} from '~/lib/gain';
import { applyBoost } from '~/native/boost';

let bridge: (() => NativeBridge) | undefined;
let unlisten: (() => void)[] = [];

function request(): BoostRequest {
	const on = settings.enabled && anySourceEnabled(settings.sources);

	return {
		sessionId: GLOBAL_AUDIO_SESSION,
		millibels: on ? boostMillibels(settings.boostDb) : 0,
	};
}

async function apply(): Promise<void> {
	if (!bridge) return;

	await applyBoost(bridge(), request());
}

export function start(context: PluginContext) {
	bridge = () => context.native;
	unlisten = [storage.onChange(({ store }) => store === addon.id, () => void apply())];

	void apply();
}

export function stop() {
	for (const off of unlisten) off();

	unlisten = [];

	if (bridge) {
		void applyBoost(bridge(), { sessionId: GLOBAL_AUDIO_SESSION, millibels: 0 });
		bridge = undefined;
	}
}
