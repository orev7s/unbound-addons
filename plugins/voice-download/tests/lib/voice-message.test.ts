import { describe, expect, test } from 'bun:test';

import { toBase64, voiceFile } from '~/lib/voice-message';

const VOICE_FLAG = 1 << 13;

describe('voiceFile', () => {
	test('reads the audio of a voice message, named after its id', () => {
		expect(
			voiceFile({
				id: '42',
				flags: VOICE_FLAG,
				attachments: [{ url: 'https://cdn.discordapp.com/a.ogg', filename: 'voice.ogg' }],
			}),
		).toEqual({ url: 'https://cdn.discordapp.com/a.ogg', filename: 'voice-message-42.ogg' });
	});

	test('falls back to the extension the attachment has', () => {
		expect(
			voiceFile({ id: '7', flags: VOICE_FLAG, attachments: [{ url: 'x', filename: 'a.m4a' }] })
				?.filename,
		).toBe('voice-message-7.m4a');
	});

	test('leaves anything that is not a voice message alone', () => {
		expect(voiceFile(undefined)).toBeUndefined();
		expect(voiceFile({ id: '1', flags: 0 })).toBeUndefined();
		expect(voiceFile({ id: '1', flags: VOICE_FLAG })).toBeUndefined();
		expect(voiceFile({ id: '1', flags: VOICE_FLAG, attachments: [{}] })).toBeUndefined();
	});
});

describe('toBase64', () => {
	test('encodes bytes, padding the tail', () => {
		expect(toBase64(new Uint8Array([0x4d, 0x61, 0x6e]))).toBe('TWFu');
		expect(toBase64(new Uint8Array([0x4d, 0x61]))).toBe('TWE=');
		expect(toBase64(new Uint8Array([0x4d]))).toBe('TQ==');
	});
});
