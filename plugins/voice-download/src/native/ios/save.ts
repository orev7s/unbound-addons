import { fs } from '@unbound-app/api';
import type { NativeBridge } from '@unbound-app/api/native';
import { Share } from 'react-native';

import { toBase64, type VoiceFile } from '~/lib/voice-message';

/**
 * @description Saves a voice message to the app's documents folder, then offers it through the share sheet.
 * @param _bridge The plugin's native bridge, unused on iOS.
 * @param file The audio file to save.
 */
export async function saveOnIOS(_bridge: NativeBridge, file: VoiceFile): Promise<void> {
	const response = await fetch(file.url);

	if (!response.ok) throw new Error(`HTTP ${response.status}`);

	const bytes = new Uint8Array(await response.arrayBuffer());

	await fs.writeFile(file.filename, toBase64(bytes), 'base64');
	await Share.share({ url: `file://${fs.documentsPath}/${file.filename}` });
}
