import { metro, patcher } from '@unbound-app/api';
import { messages } from '@unbound-app/i18n';
import { settings } from '@unbound-app/settings';
import patchLazySheets from '@v80q/plugin-shared/action-sheets/patch-lazy-sheets';
import { insertSheetRows } from '@v80q/plugin-shared/action-sheets/sheet-rows';

import { copyableAttachment, type Attachment } from '~/lib/attachments';
import { copyAttachment } from '~/lib/copy';

type SheetProps = { message?: { attachments?: Attachment[] } };

/**
 * @description Adds a Copy file contents row to the long-press sheet of a message holding a text attachment.
 */
export function patchActionSheets(): void {
	const { ActionSheets } = metro.api;

	if (typeof ActionSheets?.openLazy !== 'function') {
		logger.warn('Copy file contents skipped: Discord moved ActionSheets.');

		return;
	}

	patchLazySheets<SheetProps>(patcher, ActionSheets, (key, props) => {
		const attachment = (props.message?.attachments ?? []).find((item) =>
			copyableAttachment(item, settings.maxSize),
		);

		if (!key.endsWith('MessageLongPressActionSheet') || !attachment) return;

		return (result) => {
			insertSheetRows(result, [
				{
					key: 'unbound-copy-file-contents',
					label: messages.COPY_CONTENTS,
					icon: 'CopyIcon',
					onPress: () => void copyAttachment(attachment),
				},
			]);

			return result;
		};
	});
}

export default { patchActionSheets };
