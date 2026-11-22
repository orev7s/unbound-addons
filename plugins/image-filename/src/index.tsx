import { patcher } from '@unbound-app/api';

import { patchRows } from '~/patches';

export function start() {
	patchRows();
}

export function stop() {
	patcher.unpatchAll();
}
