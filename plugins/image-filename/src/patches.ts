import { metro, patcher } from '@unbound-app/api';
import type { MetroFunction } from '@unbound-app/api/metro';
import { settings } from '@unbound-app/settings';

import {
	captionNodes,
	imageNames,
	type ContentNode,
	type FilenameOptions,
	type RowAttachment,
} from '~/lib/filename';

type RowMessage = { content?: ContentNode[] | null; attachments?: RowAttachment[] | null };
type ChatRow = { message?: RowMessage };

/**
 * @description Appends a caption line for each image attachment to a chat row's message.
 * @param row The row Discord generated.
 * @param options Whether to keep extensions, and the longest name to show.
 */
export function addImageNames(row: ChatRow | undefined, options: FilenameOptions): void {
	const message = row?.message;

	if (!message) return;

	const names = imageNames(message.attachments, options);

	if (!names.length) return;

	const content = Array.isArray(message.content) ? message.content : [];

	message.content = [...content, ...captionNodes(names)];
}

/**
 * @description Captions every image in a chat row with its file name, by patching `RowManager.prototype.generate` once it loads.
 */
export function patchRows(): void {
	if (!metro.findByName('RowManager')) {
		logger.warn('Image filename skipped: Discord moved RowManager.');

		return;
	}

	metro.onModuleLoaded(metro.filters.byName('RowManager'), (RowManager: MetroFunction) => {
		if (typeof RowManager.prototype?.generate !== 'function') {
			logger.warn('Image filename skipped: Discord moved RowManager.generate.');

			return;
		}

		patcher.after(RowManager.prototype, 'generate', ({ result }) => {
			try {
				addImageNames(result as ChatRow, {
					showExtension: settings.showExtension,
					maxLength: settings.maxLength,
				});
			} catch (error) {
				logger.error('Failed to add image file names to a chat row:', error);
			}
		});
	});
}
