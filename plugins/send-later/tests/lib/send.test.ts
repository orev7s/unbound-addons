import { describe, expect, test } from 'bun:test';

import { sendAll } from '~/lib/send';
import type { ScheduledMessage } from '~/lib/queue';

const messages: ScheduledMessage[] = [
	{ id: 'a', channelId: '1', content: 'first', at: 1 },
	{ id: 'b', channelId: '1', content: 'second', at: 2 },
];

describe('sendAll', () => {
	test('sends each message and reports success', async () => {
		const sent: string[] = [];
		const outcomes = await sendAll(messages, async (message) => {
			sent.push(message.content);

			return { ok: true };
		});

		expect(sent).toEqual(['first', 'second']);
		expect(outcomes.map((outcome) => outcome.ok)).toEqual([true, true]);
	});

	test('treats a rejected message as a failure and keeps going', async () => {
		const outcomes = await sendAll(messages, async (message) =>
			message.id === 'a' ? { ok: false, status: 403 } : { ok: true },
		);

		expect(outcomes.map((outcome) => outcome.ok)).toEqual([false, true]);
		expect(String(outcomes[0].error)).toContain('403');
	});

	test('catches a thrown send and keeps going', async () => {
		const outcomes = await sendAll(messages, async (message) => {
			if (message.id === 'a') throw new Error('offline');

			return { ok: true };
		});

		expect(outcomes[0].ok).toBe(false);
		expect(outcomes[1].ok).toBe(true);
	});
});
