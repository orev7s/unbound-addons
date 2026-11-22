import { metro, patcher } from '@unbound-app/api';
import { messages } from '@unbound-app/i18n';
import { openSheet } from '@v80q/plugin-shared/action-sheets/open-sheet';
import patchLazySheets from '@v80q/plugin-shared/action-sheets/patch-lazy-sheets';
import { insertSheetRows } from '@v80q/plugin-shared/action-sheets/sheet-rows';

import PresetSheet from '~/components/preset-sheet';

type SheetMessage = { id?: string; channel_id?: string };
type SheetProps = { message?: SheetMessage };

/**
 * @description Adds a Remind me row to the long-press sheet of a message, opening the preset delays.
 */
export function patchActionSheets(): void {
	const { ActionSheets } = metro.api;

	if (typeof ActionSheets?.openLazy !== 'function') {
		logger.warn('Message reminders skipped: Discord moved ActionSheets.');

		return;
	}

	patchLazySheets<SheetProps>(patcher, ActionSheets, (key, props) => {
		const { id: messageId, channel_id: channelId } = props.message ?? {};

		if (!key.endsWith('MessageLongPressActionSheet') || !messageId || !channelId) return;

		return (result) => {
			insertSheetRows(result, [
				{
					key: 'unbound-message-reminders',
					label: messages.REMIND_ME,
					icon: 'TimerIcon',
					onPress: () => {
						ActionSheets.hideActionSheet(key);
						openSheet('unbound-message-reminders', PresetSheet, { channelId, messageId });
					},
				},
			]);

			return result;
		};
	});
}

export default { patchActionSheets };
