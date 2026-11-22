import { describe, expect, test } from 'bun:test';

import { copyableAttachment, isTextAttachment, withinSizeLimit } from '~/lib/attachments';

describe('isTextAttachment', () => {
	test('takes a text content type', () => {
		expect(isTextAttachment({ url: 'u', filename: 'a.bin', content_type: 'text/plain' })).toBe(true);
	});

	test('takes a text file named without a content type', () => {
		expect(isTextAttachment({ url: 'u', filename: 'notes.md' })).toBe(true);
		expect(isTextAttachment({ url: 'u', filename: 'data.json' })).toBe(true);
		expect(isTextAttachment({ url: 'u', filename: 'run.sh' })).toBe(true);
	});

	test('takes a known text type that has no useful extension', () => {
		expect(isTextAttachment({ url: 'u', filename: 'x', content_type: 'application/json' })).toBe(
			true,
		);
	});

	test('leaves other files alone', () => {
		expect(isTextAttachment({ url: 'u', filename: 'photo.png' })).toBe(false);
		expect(isTextAttachment({ url: 'u', filename: 'clip.mp4', content_type: 'video/mp4' })).toBe(
			false,
		);
		expect(isTextAttachment({ filename: 'notes.md' })).toBe(false);
		expect(isTextAttachment({ url: 'u' })).toBe(false);
	});
});

describe('withinSizeLimit', () => {
	test('allows a file at or under the limit', () => {
		expect(withinSizeLimit({ size: 100 }, 100)).toBe(true);
		expect(withinSizeLimit({ size: 50 }, 100)).toBe(true);
	});

	test('turns away a file over the limit', () => {
		expect(withinSizeLimit({ size: 101 }, 100)).toBe(false);
	});

	test('allows a file Discord reports no size for', () => {
		expect(withinSizeLimit({}, 100)).toBe(true);
	});
});

describe('copyableAttachment', () => {
	test('needs both a text file and a size the limit allows', () => {
		const text = { url: 'u', filename: 'notes.txt', size: 20 };

		expect(copyableAttachment(text, 100)).toBe(true);
		expect(copyableAttachment({ ...text, size: 200 }, 100)).toBe(false);
		expect(copyableAttachment({ url: 'u', filename: 'photo.png', size: 20 }, 100)).toBe(false);
	});
});
