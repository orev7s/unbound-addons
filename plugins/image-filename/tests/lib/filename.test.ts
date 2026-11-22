import { describe, expect, test } from 'bun:test';

import { captionName, captionNodes, imageNames, isImage } from '~/lib/filename';

const KEEP: { showExtension: boolean; maxLength: number } = { showExtension: true, maxLength: 32 };

describe('isImage', () => {
	test('reads the type Discord gives', () => {
		expect(isImage({ attachmentType: 'image' })).toBe(true);
		expect(isImage({ attachmentType: 'video' })).toBe(false);
		expect(isImage({ attachmentType: 'file' })).toBe(false);
	});

	test('falls back to the content type, then the extension', () => {
		expect(isImage({ content_type: 'image/png' })).toBe(true);
		expect(isImage({ content_type: 'application/pdf' })).toBe(false);
		expect(isImage({ filename: 'holiday.JPG' })).toBe(true);
		expect(isImage({ filename: 'notes.txt' })).toBe(false);
	});
});

describe('captionName', () => {
	test('keeps the extension by default and drops it on request', () => {
		expect(captionName('holiday.png', KEEP)).toBe('holiday.png');
		expect(captionName('holiday.png', { ...KEEP, showExtension: false })).toBe('holiday');
	});

	test('truncates a long name with an ellipsis', () => {
		expect(captionName('a-very-long-image-name.png', { showExtension: true, maxLength: 10 })).toBe(
			'a-very-lo…',
		);
	});

	test('ignores a missing name', () => {
		expect(captionName('', KEEP)).toBeUndefined();
		expect(captionName(undefined, KEEP)).toBeUndefined();
	});
});

describe('imageNames', () => {
	test('lists one name per image, in order', () => {
		expect(
			imageNames(
				[
					{ attachmentType: 'image', filename: 'one.png' },
					{ attachmentType: 'file', filename: 'doc.pdf' },
					{ attachmentType: 'image', filename: 'two.jpg' },
				],
				KEEP,
			),
		).toEqual(['one.png', 'two.jpg']);
	});

	test('is empty for a message without images', () => {
		expect(imageNames(undefined, KEEP)).toEqual([]);
		expect(imageNames([{ attachmentType: 'video', filename: 'clip.mp4' }], KEEP)).toEqual([]);
	});
});

describe('captionNodes', () => {
	test('writes one italic line per name', () => {
		expect(captionNodes(['one.png', 'two.png'])).toEqual([
			{ type: 'em', content: [{ type: 'text', content: 'one.png' }] },
			{ type: 'text', content: '\n' },
			{ type: 'em', content: [{ type: 'text', content: 'two.png' }] },
		]);
	});

	test('writes nothing for no names', () => {
		expect(captionNodes([])).toEqual([]);
	});
});
