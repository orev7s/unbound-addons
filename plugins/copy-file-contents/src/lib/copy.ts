import { metro, toasts } from '@unbound-app/api';
import { format, messages } from '@unbound-app/i18n';
import { settings } from '@unbound-app/settings';

import { isTextAttachment, withinSizeLimit, type Attachment } from '~/lib/attachments';

/**
 * @description Fetches a text attachment and copies its contents, saying why when it cannot.
 * @param attachment The attachment the long-press row belongs to.
 */
export async function copyAttachment(attachment: Attachment): Promise<void> {
	if (!isTextAttachment(attachment)) {
		toasts.show({ title: addon.name, content: messages.NOT_TEXT_FILE });

		return;
	}

	const name = attachment.filename!;

	if (!withinSizeLimit(attachment, settings.maxSize)) {
		toasts.show({ title: addon.name, content: format('TOO_LARGE', { name }) });

		return;
	}

	try {
		const response = await fetch(attachment.url!);

		if (!response.ok) throw new Error(`HTTP ${response.status}`);

		metro.common.Clipboard.setString(await response.text());

		toasts.show({ title: addon.name, content: format('COPIED_FILE', { name }) });
	} catch (error) {
		logger.error(`Failed to copy the file ${attachment.filename}:`, error);
		toasts.show({ title: addon.name, content: messages.COPY_FILE_FAILED });
	}
}

export default copyAttachment;
