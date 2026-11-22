import { patcher } from '@unbound-app/api';

import { patchRelationshipStore } from '~/patches';

export function start() {
	patchRelationshipStore();
}

export function stop() {
	patcher.unpatchAll();
}
