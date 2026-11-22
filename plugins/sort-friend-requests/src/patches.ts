import { flux, patcher } from '@unbound-app/api';
import { settings } from '@unbound-app/settings';

import { sortRelationships, sortSuggestions, type Suggestion } from '~/lib/requests';

type RelationshipStoreLike = {
	getMutableRelationships: () => unknown;
	getRelationships: () => unknown;
	getSuggestedFriends: () => unknown;
};

const REQUEST_METHODS = ['getMutableRelationships', 'getRelationships'] as const;

/**
 * @description Orders the pending friend requests the Relationship store hands the friends list, and the
 * suggested friends list when the setting asks for it and the store exposes one.
 */
export function patchRelationshipStore(): void {
	const store = flux.getStore('Relationship') as unknown as RelationshipStoreLike;
	const methods = REQUEST_METHODS.filter((method) => typeof store?.[method] === 'function');

	if (!methods.length) {
		logger.warn('Sort friend requests skipped: Discord moved the Relationship store.');

		return;
	}

	for (const method of methods) {
		patcher.after(store, method, ({ result }) => sortRelationships(result, settings.direction));
	}

	if (!settings.suggestions) return;

	if (typeof store.getSuggestedFriends !== 'function') {
		logger.warn(
			'Sort friend suggestions skipped: Discord moved RelationshipStore.getSuggestedFriends.',
		);

		return;
	}

	patcher.after(store, 'getSuggestedFriends', ({ result }) =>
		Array.isArray(result) ? sortSuggestions(result as Suggestion[], settings.direction) : result,
	);
}

export default { patchRelationshipStore };
