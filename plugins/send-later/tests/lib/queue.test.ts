import { describe, expect, test } from 'bun:test';

import {
	addToQueue,
	parseQueue,
	removeByNumber,
	takeDue,
	type ScheduledMessage,
} from '~/lib/queue';

function message(id: string, at: number): ScheduledMessage {
	return { id, channelId: '1', content: id, at };
}

describe('parseQueue', () => {
	test('keeps messages and drops anything else, oldest first', () => {
		expect(
			parseQueue([message('b', 200), { junk: true }, message('a', 100), null]),
		).toEqual([message('a', 100), message('b', 200)]);
	});

	test('reads a missing or non-list value as empty', () => {
		expect(parseQueue(undefined)).toEqual([]);
		expect(parseQueue('nope')).toEqual([]);
	});
});

describe('addToQueue', () => {
	test('inserts by when it sends', () => {
		expect(addToQueue([message('a', 100)], message('b', 50))).toEqual([
			message('b', 50),
			message('a', 100),
		]);
	});
});

describe('removeByNumber', () => {
	test('removes the message at the 1-based position it lists', () => {
		const { queue, removed } = removeByNumber([message('a', 100), message('b', 200)], 2);

		expect(removed).toEqual(message('b', 200));
		expect(queue).toEqual([message('a', 100)]);
	});

	test('removes nothing out of range', () => {
		expect(removeByNumber([message('a', 100)], 5).removed).toBeUndefined();
		expect(removeByNumber([message('a', 100)], 0).removed).toBeUndefined();
	});
});

describe('takeDue', () => {
	test('splits the ones due now from the rest, keeping order', () => {
		const { due, rest } = takeDue(
			[message('a', 100), message('b', 200), message('c', 300)],
			200,
		);

		expect(due).toEqual([message('a', 100), message('b', 200)]);
		expect(rest).toEqual([message('c', 300)]);
	});
});
