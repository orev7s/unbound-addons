import { defineSettings, setting } from '@unbound-app/settings/schema';

export default defineSettings(
	{
		notify: setting.boolean({
			default: true,
			title: 'NOTIFY',
			subtitle: 'NOTIFY_SUBTITLE',
		}),
		defaultDelay: setting.number({
			displayAs: 'duration',
			units: ['m', 'h', 'd'],
			min: 60_000,
			default: 1_800_000,
			title: 'DEFAULT_DELAY',
			subtitle: 'DEFAULT_DELAY_SUBTITLE',
		}),
		limit: setting.integer({
			displayAs: 'stepper',
			min: 1,
			max: 100,
			default: 20,
			title: 'LIMIT',
			subtitle: 'LIMIT_SUBTITLE',
		}),
	},
	{ title: 'SEND_LATER' },
);
