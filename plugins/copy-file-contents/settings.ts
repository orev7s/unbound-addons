import { defineSettings, setting } from '@unbound-app/settings/schema';

export default defineSettings(
	{
		maxSize: setting.integer({
			displayAs: 'input',
			min: 1_000,
			default: 1_000_000,
			title: 'MAX_SIZE',
			subtitle: 'MAX_SIZE_SUBTITLE',
		}),
	},
	{ title: 'COPY_FILE_CONTENTS' },
);
