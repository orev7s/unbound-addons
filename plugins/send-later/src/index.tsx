import { flux, metro, toasts } from '@unbound-app/api';
import { settings } from '@unbound-app/settings';

import { registerLater } from '~/commands';
import { readQueue, takeDue, writeQueue } from '~/lib/queue';
import { sendAll } from '~/lib/send';

const CHECK_INTERVAL_MS = 20_000;

type MessageActions = {
	_sendMessage?: (
		channelId: string,
		message: Record<string, unknown>,
		options?: Record<string, unknown>,
	) => Promise<{ ok?: boolean; status?: number } | undefined>;
};

const ChannelStore = flux.getStore('Channel');

function channelName(channelId: string): string {
	return ChannelStore.getChannel(channelId)?.name || channelId;
}

/**
 * @description Sends every queued message that is due, dropping each from the queue before sending so a failure never re-sends one.
 * @returns Whether anything was due.
 */
async function flush(): Promise<boolean> {
	const { due, rest } = takeDue(readQueue(), Date.now());

	if (!due.length) return false;

	const Messages = metro.findByProps('sendMessage', 'receiveMessage') as MessageActions | undefined;

	if (typeof Messages?._sendMessage !== 'function') {
		logger.warn('Send later skipped: Discord moved the message actions.');

		return false;
	}

	writeQueue(rest);

	const outcomes = await sendAll(due, (message) =>
		Messages._sendMessage!(message.channelId, {
			content: message.content,
			tts: false,
			invalidEmojis: [],
			validNonShortcutEmojis: [],
		}),
	);

	for (const { message, ok, error } of outcomes) {
		const name = channelName(message.channelId);

		if (ok) {
			if (settings.notify) toasts.success('SENT_BODY', { channel: name });
		} else {
			logger.error(`Failed to send the scheduled message in channel ${message.channelId}:`, error);
			toasts.error('SEND_FAILED', { channel: name }, error);
		}
	}

	return true;
}

export function start() {
	registerLater();
	setInterval(() => void flush(), CHECK_INTERVAL_MS);

	try {
		unbound.background?.add('send-later', () => flush());
	} catch (error) {
		logger.warn('Send later will only send while Discord is open:', error);
	}
}
