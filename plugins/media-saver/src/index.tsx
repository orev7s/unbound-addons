import { patcher } from '@unbound-app/api';

import { patchImageSources } from '~/patches';

export function start() {
	patchImageSources();
}

export function stop() {
	patcher.unpatchAll();
}
