import { storage } from '@unbound-app/api';

export type ScheduledMessage = {
	id: string;
	channelId: string;
	content: string;
	at: number;
};

const QUEUE_KEY = 'queue';

/**
 * @description Checks a stored value is a scheduled message, so one written by an older version never breaks reading.
 * @param value The stored value.
 * @returns Whether it is a scheduled message.
 */
export function isScheduledMessage(value: unknown): value is ScheduledMessage {
	if (typeof value !== 'object' || value === null) return false;

	const { id, channelId, content, at } = value as Record<string, unknown>;

	return (
		typeof id === 'string' &&
		typeof channelId === 'string' &&
		typeof content === 'string' &&
		typeof at === 'number' &&
		Number.isFinite(at)
	);
}

/**
 * @description Reads the queue out of whatever is stored under the queue key, dropping anything that is not a message.
 * @param value The stored value.
 * @returns The scheduled messages, oldest first.
 */
export function parseQueue(value: unknown): ScheduledMessage[] {
	if (!Array.isArray(value)) return [];

	return value.filter(isScheduledMessage).sort((left, right) => left.at - right.at);
}

/**
 * @description Adds a message to the queue, keeping it ordered by when it sends.
 * @param queue The messages waiting.
 * @param message The message to add.
 * @returns A new queue.
 */
export function addToQueue(
	queue: readonly ScheduledMessage[],
	message: ScheduledMessage,
): ScheduledMessage[] {
	return [...queue, message].sort((left, right) => left.at - right.at);
}

/**
 * @description Removes the message at a 1-based position, as the list numbers them.
 * @param queue The messages waiting.
 * @param number The position shown in the list.
 * @returns The new queue, and whether anything was removed.
 */
export function removeByNumber(
	queue: readonly ScheduledMessage[],
	number: number,
): { queue: ScheduledMessage[]; removed: ScheduledMessage | undefined } {
	const index = Math.trunc(number) - 1;
	const removed = index >= 0 && index < queue.length ? queue[index] : undefined;

	return { queue: queue.filter((message) => message !== removed), removed };
}

/**
 * @description Splits a queue into the messages due now and the rest, in order.
 * @param queue The messages waiting.
 * @param now The current time.
 * @returns The due messages, and the ones still waiting.
 */
export function takeDue(
	queue: readonly ScheduledMessage[],
	now: number,
): { due: ScheduledMessage[]; rest: ScheduledMessage[] } {
	const due: ScheduledMessage[] = [];
	const rest: ScheduledMessage[] = [];

	for (const message of queue) {
		(message.at <= now ? due : rest).push(message);
	}

	return { due, rest };
}

function bucket() {
	return storage.getBucket();
}

/** Reads the messages waiting, oldest first. */
export function readQueue(): ScheduledMessage[] {
	return parseQueue(bucket().get(QUEUE_KEY, []));
}

/** Saves the queue, newest order first as {@link readQueue} returns it. */
export function writeQueue(queue: readonly ScheduledMessage[]): void {
	bucket().set(QUEUE_KEY, queue as never);
}

/**
 * @description Queues a message to send later.
 * @param channelId The channel to send it in.
 * @param content The message text.
 * @param at When to send it, as milliseconds since the epoch.
 * @returns The queued message.
 */
export function enqueue(channelId: string, content: string, at: number): ScheduledMessage {
	const message: ScheduledMessage = {
		id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
		channelId,
		content,
		at,
	};

	writeQueue(addToQueue(readQueue(), message));

	return message;
}
