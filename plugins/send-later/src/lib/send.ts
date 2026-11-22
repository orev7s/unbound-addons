import type { ScheduledMessage } from '~/lib/queue';

/** How one queued message went. */
export type SendOutcome = { message: ScheduledMessage; ok: boolean; error?: unknown };

/**
 * @description Sends each queued message through the given sender, one at a time, recording how each went so one
 * failure never stops the rest.
 * @param messages The messages to send.
 * @param send Sends one message; resolves to Discord's result, whose `ok: false` counts as a failure.
 * @returns One outcome per message, in order.
 */
export async function sendAll(
	messages: readonly ScheduledMessage[],
	send: (message: ScheduledMessage) => Promise<{ ok?: boolean; status?: number } | undefined>,
): Promise<SendOutcome[]> {
	const outcomes: SendOutcome[] = [];

	for (const message of messages) {
		try {
			const result = await send(message);

			if (result?.ok === false) {
				throw new Error(`Discord rejected the message with status ${result.status ?? 'unknown'}`);
			}

			outcomes.push({ message, ok: true });
		} catch (error) {
			outcomes.push({ message, ok: false, error });
		}
	}

	return outcomes;
}
