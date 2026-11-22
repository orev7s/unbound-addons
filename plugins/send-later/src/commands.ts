import { commands } from '@unbound-app/api';
import { format, messages } from '@unbound-app/i18n';
import { settings } from '@unbound-app/settings';

import { describeWhen, parseWhen } from '~/lib/schedule';
import { enqueue, readQueue, removeByNumber, writeQueue } from '~/lib/queue';

/**
 * @description Adds `/later`, which queues a message for a time, and `/laters`, which lists or cancels queued messages.
 */
export function registerLater(): void {
	commands.register({
		later: {
			description: 'LATER_DESC',
			options: {
				when: commands.option.string({ description: 'WHEN_DESC', required: true }),
				message: commands.option.string({
					description: 'MESSAGE_DESC',
					required: true,
					maxLength: 2000,
				}),
			},
			execute: ({ when, message }, context) => {
				const at = when ? parseWhen(when) : undefined;

				if (!at) return { ephemeral: true, content: format('BAD_WHEN', { when: when ?? '' }) };

				if (readQueue().length >= settings.limit) {
					return { ephemeral: true, content: format('QUEUE_FULL', { limit: settings.limit }) };
				}

				enqueue(context.channel.id, message ?? '', at.getTime());

				return { ephemeral: true, content: format('SCHEDULED', { when: describeWhen(at) }) };
			},
		},
		laters: {
			description: 'LATERS_DESC',
			options: {
				cancel: commands.option.string({ description: 'CANCEL_DESC' }),
			},
			execute: ({ cancel }) => {
				const queue = readQueue();

				if (!queue.length) return { ephemeral: true, content: messages.NO_LATERS };

				if (cancel) {
					const { queue: rest, removed } = removeByNumber(queue, Number(cancel));

					if (!removed) {
						return {
							ephemeral: true,
							content: format('NOT_CANCELLED', { number: cancel }),
						};
					}

					writeQueue(rest);

					return { ephemeral: true, content: format('CANCELLED', { number: cancel }) };
				}

				const lines = queue.map((message, index) =>
					format('LATERS_LINE', {
						number: index + 1,
						when: describeWhen(new Date(message.at)),
					}),
				);

				return { ephemeral: true, content: [messages.LATERS_HEADER, ...lines].join('\n') };
			},
		},
	});
}
