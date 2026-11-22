import { defineSettings, setting } from '@unbound-app/settings/schema';

export default defineSettings(
	{
		notify: setting.boolean({
			default: true,
			title: 'NOTIFY',
			subtitle: 'NOTIFY_SUBTITLE',
		}),
	},
	{ title: 'MESSAGE_REMINDERS' },
);
