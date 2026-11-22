import { commands, startPlugin } from '@unbound-app/api/testing';
import { settings } from '@unbound-app/settings';
import { beforeEach, describe, expect, test } from 'bun:test';

type Reply = { ephemeral?: boolean; content?: string };

async function schedule(when: string, message: string): Promise<Reply> {
	return (await commands.run('later', { when, message })) as Reply;
}

beforeEach(async () => {
	await startPlugin();
});

describe('/later', () => {
	test('registers both commands', () => {
		expect([...commands.registered.keys()]).toEqual(expect.arrayContaining(['later', 'laters']));
	});

	test('queues a message and confirms when it will send', async () => {
		const reply = await schedule('2h', 'hello');

		expect(reply.ephemeral).toBe(true);
		expect(reply.content).toContain('Sending');
	});

	test('refuses a time it cannot read', async () => {
		const reply = await schedule('banana', 'hello');

		expect(reply.content).toContain('not a time');
	});

	test('refuses once the queue is full', async () => {
		settings.limit = 1;
		await schedule('2h', 'first');

		expect((await schedule('2h', 'second')).content).toContain('waiting');
	});
});

describe('/laters', () => {
	test('says so when nothing waits', async () => {
		expect((await commands.run('laters')).content).toBe('No messages are waiting.');
	});

	test('lists queued messages, numbered', async () => {
		await schedule('2h', 'first');
		await schedule('3h', 'second');

		const reply = (await commands.run('laters')) as Reply;

		expect(reply.content).toContain('Waiting messages:');
		expect(reply.content).toContain('1.');
		expect(reply.content).toContain('2.');
	});

	test('cancels the message at the number it lists', async () => {
		await schedule('2h', 'first');
		await schedule('3h', 'second');

		const cancelled = (await commands.run('laters', { cancel: '1' })) as Reply;
		expect(cancelled.content).toBe('Cancelled message 1.');

		const remaining = (await commands.run('laters')) as Reply;
		expect(remaining.content?.split('\n')).toHaveLength(2);
	});

	test('says so when the number is not there', async () => {
		await schedule('2h', 'first');

		expect(((await commands.run('laters', { cancel: '9' })) as Reply).content).toBe(
			'There is no message number 9.',
		);
	});
});
