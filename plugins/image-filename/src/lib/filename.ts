/** A rendered message-content node, as Discord's chat rows hold it. */
export type ContentNode = { type: string; content?: unknown };

/** A message attachment as a chat row carries it. */
export type RowAttachment = {
	filename?: string;
	attachmentType?: string;
	content_type?: string;
};

/** What the caption should show. */
export type FilenameOptions = {
	showExtension: boolean;
	maxLength: number;
};

const IMAGE_TYPE = /^image\//;
const IMAGE_EXTENSION = /\.(png|jpe?g|gif|webp|avif|bmp|heic)$/i;
const EXTENSION = /\.[a-z0-9]{1,5}$/i;

/**
 * @description Tells whether an attachment is an image.
 * @param attachment The attachment.
 * @returns `true` for an image, by the type Discord gives or else by its extension.
 */
export function isImage(attachment: RowAttachment): boolean {
	if (attachment.attachmentType) return attachment.attachmentType === 'image';

	if (attachment.content_type) return IMAGE_TYPE.test(attachment.content_type);

	return IMAGE_EXTENSION.test(attachment.filename ?? '');
}

/**
 * @description Writes a file name the caption shows: its extension kept or dropped, and a long one truncated with an ellipsis.
 * @param filename The file name.
 * @param options Whether to keep the extension, and the longest name to show.
 * @returns The caption text, or `undefined` when there is no name.
 */
export function captionName(
	filename: string | undefined,
	{ showExtension, maxLength }: FilenameOptions,
): string | undefined {
	const full = (filename ?? '').trim();

	if (!full) return undefined;

	const name = showExtension ? full : full.replace(EXTENSION, '');

	if (name.length <= maxLength) return name;

	return `${name.slice(0, Math.max(1, maxLength - 1)).trimEnd()}…`;
}

/**
 * @description Reads the file names of a message's image attachments.
 * @param attachments The attachments.
 * @param options Whether to keep extensions, and the longest name to show.
 * @returns One name per image attachment, in order.
 */
export function imageNames(
	attachments: readonly RowAttachment[] | null | undefined,
	options: FilenameOptions,
): string[] {
	return (attachments ?? []).flatMap((attachment) => {
		if (!isImage(attachment)) return [];

		const name = captionName(attachment.filename, options);

		return name ? [name] : [];
	});
}

/**
 * @description Builds the caption nodes a chat row shows for the given names, one per line.
 * @param names The file names.
 * @returns The content nodes to append, or an empty array for no names.
 */
export function captionNodes(names: readonly string[]): ContentNode[] {
	return names.flatMap((name, index) => [
		...(index ? [{ type: 'text', content: '\n' }] : []),
		{ type: 'em', content: [{ type: 'text', content: name }] },
	]);
}
