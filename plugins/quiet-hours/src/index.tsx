import { settings } from '@unbound-app/settings';

import { resetQuiet, syncQuiet } from '~/lib/apply';

const CHECK_INTERVAL_MS = 30_000;

let timer: ReturnType<typeof setInterval> | undefined;

export function start() {
	resetQuiet();
	syncQuiet(new Date(), settings);
	timer = setInterval(() => syncQuiet(new Date(), settings), CHECK_INTERVAL_MS);
}

export function stop() {
	clearInterval(timer);
	timer = undefined;
}
