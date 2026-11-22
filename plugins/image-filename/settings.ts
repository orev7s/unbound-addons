import { defineSettings, setting } from '@unbound-app/settings/schema';

export default defineSettings(
	{
		showExtension: setting.boolean({
			default: true,
			title: 'SHOW_EXTENSION',
			subtitle: 'SHOW_EXTENSION_SUBTITLE',
		}),
		maxLength: setting.integer({
			displayAs: 'stepper',
			step: 4,
			min: 8,
			max: 80,
			default: 32,
			title: 'MAX_LENGTH',
			subtitle: 'MAX_LENGTH_SUBTITLE',
		}),
	},
	{ title: 'IMAGE_FILENAME' },
);
