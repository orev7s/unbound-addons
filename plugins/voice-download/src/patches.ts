import { metro, patcher } from '@unbound-app/api';
import type { NativeBridge } from '@unbound-app/api/native';
import { messages } from '@unbound-app/i18n';
import patchLazySheets from '@v80q/plugin-shared/action-sheets/patch-lazy-sheets';
import { insertSheetRows } from '@v80q/plugin-shared/action-sheets/sheet-rows';

import { downloadVoiceMessage } from '~/lib/download';
import { voiceFile, type SheetMessage } from '~/lib/voice-message';

type SheetProps = { message?: SheetMessage };

/**
 * @description Adds a Download row to the long-press sheet of a message that is a voice message.
 * @param bridge The plugin's native bridge, passed through to the download.
 */
export function patchActionSheets(bridge: () => NativeBridge): void {
	const { ActionSheets } = metro.api;

	if (typeof ActionSheets?.openLazy !== 'function') {
		logger.warn('Voice download skipped: Discord moved ActionSheets.');

		return;
	}

	patchLazySheets<SheetProps>(patcher, ActionSheets, (key, props) => {
		const message = props.message;

		if (!key.endsWith('MessageLongPressActionSheet') || !voiceFile(message)) return;

		return (result) => {
			insertSheetRows(result, [
				{
					key: 'unbound-voice-download',
					label: messages.DOWNLOAD,
					icon: 'DownloadIcon',
					onPress: () => void downloadVoiceMessage(bridge, message!),
				},
			]);

			return result;
		};
	});
}
