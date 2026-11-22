/** Which end of the list the newest requests sit at. */
export type Direction = 'newest' | 'oldest';

/** A relationship store value: a bare type, or a record with its `type` and `since`. */
export type RelationshipValue = number | { type?: number; since?: string } | null | undefined;

/** One relationship, by user id. */
export type RelationshipEntry = readonly [id: string, value: RelationshipValue];

/** A suggested friend as the store lists one. */
export type Suggestion = { user?: { id?: string } };

export const INCOMING_REQUEST = 3;
export const OUTGOING_REQUEST = 4;

const DISCORD_EPOCH = 1_420_070_400_000;
const SNOWFLAKE_SHIFT = 4_194_304;

/**
 * @description Tells whether a relationship type is a pending friend request.
 * @param type Discord's relationship type.
 * @returns Whether it is an incoming or outgoing request.
 */
export function isPendingRequest(type: number): boolean {
	return type === INCOMING_REQUEST || type === OUTGOING_REQUEST;
}

/**
 * @description Reads a relationship type from a store value, which is a number or a record with `type`.
 * @param value The store value.
 * @returns The type, or `0` when there is none.
 */
export function relationshipTypeOf(value: RelationshipValue): number {
	if (typeof value === 'number') return value;

	return value?.type ?? 0;
}

function relationshipSinceOf(value: RelationshipValue): string | undefined {
	return typeof value === 'object' && value !== null ? value.since : undefined;
}

/**
 * @description Reads the creation time Discord packs into a snowflake's high bits.
 * @param id The snowflake.
 * @returns Milliseconds since the epoch, or `0` for a value that is not a snowflake.
 */
export function snowflakeTime(id: string): number {
	const numeric = Number(id);

	return Number.isFinite(numeric) ? Math.floor(numeric / SNOWFLAKE_SHIFT) + DISCORD_EPOCH : 0;
}

/**
 * @description Reads when a request arrived: its own date, else when the user's account was made.
 * @param entry The relationship.
 * @returns Milliseconds since the epoch.
 */
export function requestTime(entry: RelationshipEntry): number {
	const since = relationshipSinceOf(entry[1]);

	if (since) {
		const parsed = Date.parse(since);

		if (Number.isFinite(parsed)) return parsed;
	}

	return snowflakeTime(entry[0]);
}

/**
 * @description Orders two friend requests by when they arrived.
 * @param left One request.
 * @param right The other.
 * @param direction Which end the newest sits at.
 * @returns The sort order.
 */
export function compareRequests(
	left: RelationshipEntry,
	right: RelationshipEntry,
	direction: Direction,
): number {
	const diff = requestTime(left) - requestTime(right);

	return direction === 'newest' ? -diff : diff;
}

/**
 * @description Reorders the pending friend requests among the positions they already hold, leaving friends,
 * blocks and everything else where they are.
 * @param entries The relationship store's entries.
 * @param direction Which end the newest sits at.
 * @returns A new list of entries.
 */
export function sortRequestEntries(
	entries: readonly RelationshipEntry[],
	direction: Direction,
): RelationshipEntry[] {
	const positions: number[] = [];

	for (let index = 0; index < entries.length; index++) {
		if (isPendingRequest(relationshipTypeOf(entries[index]![1]))) positions.push(index);
	}

	const requests = positions.map((index) => entries[index]!);
	const sorted = [...requests].sort((left, right) => compareRequests(left, right, direction));
	const result = [...entries];

	positions.forEach((position, index) => {
		result[position] = sorted[index]!;
	});

	return result;
}

/**
 * @description Orders a relationship store's entries, as a `Map` or a record keyed by user id.
 * @param source The store's entries.
 * @param direction Which end the newest sits at.
 * @returns The same shape, with the pending requests reordered.
 */
export function sortRelationships(source: unknown, direction: Direction): unknown {
	if (source instanceof Map) {
		return new Map(sortRequestEntries([...source.entries()] as RelationshipEntry[], direction));
	}

	if (source !== null && typeof source === 'object') {
		return Object.fromEntries(
			sortRequestEntries(Object.entries(source) as RelationshipEntry[], direction),
		);
	}

	return source;
}

/**
 * @description Orders a suggested friends list, newest first or oldest first.
 * @param list The suggestions.
 * @param direction Which end the newest sits at.
 * @returns A new list.
 */
export function sortSuggestions(
	list: readonly Suggestion[],
	direction: Direction,
): Suggestion[] {
	const sorted = [...list].sort(
		(left, right) => snowflakeTime(left.user?.id ?? '') - snowflakeTime(right.user?.id ?? ''),
	);

	return direction === 'newest' ? sorted.reverse() : sorted;
}

export default {
	compareRequests,
	isPendingRequest,
	relationshipTypeOf,
	snowflakeTime,
	sortRelationships,
	sortRequestEntries,
	sortSuggestions,
};
