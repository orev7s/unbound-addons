/** An attachment as the long-press sheet passes it. */
export type Attachment = {
	filename?: string;
	url?: string;
	size?: number;
	content_type?: string;
};

// Extensions that hold text, so a file named `.txt` with no content type is still copyable.
const TEXT_EXTENSIONS = new Set([
	'txt',
	'md',
	'markdown',
	'json',
	'jsonc',
	'csv',
	'tsv',
	'log',
	'yml',
	'yaml',
	'toml',
	'ini',
	'cfg',
	'conf',
	'env',
	'xml',
	'html',
	'css',
	'scss',
	'less',
	'js',
	'jsx',
	'mjs',
	'cjs',
	'ts',
	'tsx',
	'py',
	'rb',
	'go',
	'rs',
	'java',
	'kt',
	'swift',
	'c',
	'h',
	'cpp',
	'cs',
	'php',
	'sh',
	'bash',
	'zsh',
	'sql',
	'graphql',
	'diff',
	'patch',
]);

// Content types Discord reports that hold text but often have no useful extension.
const TEXT_TYPES = new Set([
	'application/json',
	'application/ld+json',
	'application/xml',
	'application/javascript',
	'application/x-sh',
	'application/x-yaml',
	'application/yaml',
	'application/sql',
	'image/svg+xml',
]);

function extensionOf(filename: string): string {
	const dot = filename.lastIndexOf('.');

	return dot < 0 ? '' : filename.slice(dot + 1).toLowerCase();
}

/**
 * @description Tells whether an attachment holds text this plugin can copy.
 * @param attachment The attachment.
 * @returns Whether it is a text file.
 */
export function isTextAttachment(attachment: Attachment): boolean {
	const { filename = '', content_type: type = '' } = attachment;

	if (!attachment.url || !filename) return false;

	return type.startsWith('text/') || TEXT_TYPES.has(type) || TEXT_EXTENSIONS.has(extensionOf(filename));
}

/**
 * @description Tells whether an attachment is small enough to fetch and copy.
 * @param attachment The attachment.
 * @param maxBytes The largest file to copy; an attachment Discord reports no size for is allowed.
 * @returns Whether it fits.
 */
export function withinSizeLimit(attachment: Attachment, maxBytes: number): boolean {
	return (attachment.size ?? 0) <= maxBytes;
}

/**
 * @description Decides whether a long-press row should offer to copy an attachment's text.
 * @param attachment The attachment.
 * @param maxBytes The largest file to copy.
 * @returns Whether the attachment can be copied.
 */
export function copyableAttachment(attachment: Attachment, maxBytes: number): boolean {
	return isTextAttachment(attachment) && withinSizeLimit(attachment, maxBytes);
}

export default { copyableAttachment, isTextAttachment, withinSizeLimit };
