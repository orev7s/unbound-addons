import { metro, startPlugin } from '@unbound-app/api/testing';
import { settings } from '@unbound-app/settings';
import { beforeEach, describe, expect, test } from 'bun:test';

type Attachment = { attachmentType?: string; filename?: string };
type ContentNode = { type: string; content?: unknown };
type Message = { id: string; content: string; attachments?: Attachment[] };
type Row = { message: { id: string; content: ContentNode[]; attachments?: Attachment[] } };

// Draws a chat row the way Discord's RowManager does, so the patch runs for real.
class RowManager {
	generate(input: { message: Message }): Row {
		const { id, content, attachments } = input.message;

		return { message: { id, content: [{ type: 'text', content }], attachments } };
	}
}

function generate(attachments?: Attachment[]): Row {
	return new RowManager().generate({ message: { id: 'm1', content: 'hello', attachments } });
}

function shown(row: Row): string {
	return JSON.stringify(row.message.content);
}

beforeEach(async () => {
	metro.register(RowManager);
	await startPlugin();
});

describe('image filenames in chat', () => {
	test('adds the file name for each image', () => {
		const row = generate([
			{ attachmentType: 'image', filename: 'cat.png' },
			{ attachmentType: 'file', filename: 'notes.pdf' },
		]);

		expect(shown(row)).toContain('cat.png');
		expect(shown(row)).not.toContain('notes.pdf');
	});

	test('leaves a message without images alone', () => {
		const row = generate([{ attachmentType: 'video', filename: 'clip.mp4' }]);

		expect(row.message.content).toEqual([{ type: 'text', content: 'hello' }]);
	});

	test('drops the extension when the setting is off', () => {
		settings.showExtension = false;

		expect(shown(generate([{ attachmentType: 'image', filename: 'cat.png' }]))).toContain('"cat"');
	});

	test('truncates a name longer than the limit', () => {
		settings.maxLength = 12;

		expect(shown(generate([{ attachmentType: 'image', filename: 'a-very-long-name.png' }]))).toContain(
			'a-very-long…',
		);
	});
});
