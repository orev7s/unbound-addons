import { toasts } from '@unbound-app/api';
import type { NativeBridge } from '@unbound-app/api/native';
import { format, messages } from '@unbound-app/i18n';

import { voiceFile, type SheetMessage } from '~/lib/voice-message';
import { saveVoiceFile } from '~/native/save';

/**
 * @description Saves the audio of a voice message, as the sheet's row asks.
 * @param bridge The plugin's native bridge, for saving the file.
 * @param message The voice message.
 */
export async function downloadVoiceMessage(
	bridge: () => NativeBridge,
	message: SheetMessage,
): Promise<void> {
	const file = voiceFile(message);

	if (!file) {
		logger.warn(`Failed to download voice message ${message.id}: it has no audio file.`);
		toasts.show({ title: addon.name, content: messages.DOWNLOAD_FAILED });

		return;
	}

	toasts.show({ title: addon.name, content: format('DOWNLOADING', { name: file.filename }) });

	try {
		await saveVoiceFile(bridge(), file);
	} catch (error) {
		logger.error(`Failed to download voice message ${message.id}:`, error);
		toasts.show({ title: addon.name, content: messages.DOWNLOAD_FAILED });
	}
}
