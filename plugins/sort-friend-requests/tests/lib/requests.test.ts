import { describe, expect, test } from 'bun:test';

import {
	compareRequests,
	isPendingRequest,
	relationshipTypeOf,
	snowflakeTime,
	sortRequestEntries,
	sortSuggestions,
	type RelationshipEntry,
} from '~/lib/requests';

// A snowflake whose creation time is `step` milliseconds past the shift, so times stay exact.
const snowflake = (step: number) => String(4_194_304 * step);

describe('isPendingRequest', () => {
	test('takes incoming and outgoing requests only', () => {
		expect(isPendingRequest(3)).toBe(true);
		expect(isPendingRequest(4)).toBe(true);
		expect(isPendingRequest(1)).toBe(false);
		expect(isPendingRequest(2)).toBe(false);
		expect(isPendingRequest(0)).toBe(false);
	});
});

describe('relationshipTypeOf', () => {
	test('reads a bare type or a record', () => {
		expect(relationshipTypeOf(3)).toBe(3);
		expect(relationshipTypeOf({ type: 4 })).toBe(4);
		expect(relationshipTypeOf(undefined)).toBe(0);
		expect(relationshipTypeOf(null)).toBe(0);
	});
});

describe('snowflakeTime', () => {
	test('reads the creation time from the high bits', () => {
		// Floor(4194304 / 4194304) = 1 ms past Discord's epoch.
		expect(snowflakeTime(snowflake(1))).toBe(1_420_070_400_001);
		expect(snowflakeTime('not-a-snowflake')).toBe(0);
	});
});

describe('compareRequests', () => {
	const older: RelationshipEntry = ['a', { type: 3, since: '2026-01-01T00:00:00Z' }];
	const newer: RelationshipEntry = ['b', { type: 3, since: '2026-02-01T00:00:00Z' }];

	test('newest first puts the later request first', () => {
		expect(compareRequests(newer, older, 'newest')).toBeLessThan(0);
	});

	test('oldest first puts the earlier request first', () => {
		expect(compareRequests(older, newer, 'oldest')).toBeLessThan(0);
	});

	test('falls back to the user snowflake when no date is stored', () => {
		const early: RelationshipEntry = [snowflake(10), 3];
		const late: RelationshipEntry = [snowflake(20), 4];

		expect(compareRequests(late, early, 'newest')).toBeLessThan(0);
	});
});

describe('sortRequestEntries', () => {
	const entries: RelationshipEntry[] = [
		['friend', { type: 1 }],
		['old', { type: 3, since: '2026-01-01T00:00:00Z' }],
		['blocked', { type: 2 }],
		['new', { type: 3, since: '2026-02-01T00:00:00Z' }],
		['out', { type: 4, since: '2025-12-01T00:00:00Z' }],
	];

	test('newest first, leaving other relationships where they are', () => {
		expect(sortRequestEntries(entries, 'newest').map(([id]) => id)).toEqual([
			'friend',
			'new',
			'blocked',
			'old',
			'out',
		]);
	});

	test('oldest first', () => {
		expect(sortRequestEntries(entries, 'oldest').map(([id]) => id)).toEqual([
			'friend',
			'out',
			'blocked',
			'old',
			'new',
		]);
	});

	test('leaves a list with no requests untouched', () => {
		const friends: RelationshipEntry[] = [
			['a', { type: 1 }],
			['b', { type: 2 }],
		];

		expect(sortRequestEntries(friends, 'newest')).toEqual(friends);
	});
});

describe('sortSuggestions', () => {
	test('orders by the user snowflake', () => {
		const list = [{ user: { id: snowflake(30) } }, { user: { id: snowflake(10) } }];

		expect(sortSuggestions(list, 'newest').map((item) => item.user?.id)).toEqual([
			snowflake(30),
			snowflake(10),
		]);
		expect(sortSuggestions(list, 'oldest').map((item) => item.user?.id)).toEqual([
			snowflake(10),
			snowflake(30),
		]);
	});
});
