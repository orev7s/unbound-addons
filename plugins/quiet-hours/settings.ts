import { defineSettings, setting } from '@unbound-app/settings/schema';

export default defineSettings(
	{
		enabled: setting.boolean({
			default: true,
			title: 'ENABLED',
			subtitle: 'ENABLED_SUBTITLE',
		}),
		mute: setting.boolean({
			default: true,
			title: 'MUTE',
			subtitle: 'MUTE_SUBTITLE',
		}),
		start: setting.string({
			displayAs: 'input',
			maxLength: 5,
			default: '22:00',
			title: 'START',
			subtitle: 'START_SUBTITLE',
		}),
		end: setting.string({
			displayAs: 'input',
			maxLength: 5,
			default: '08:00',
			title: 'END',
			subtitle: 'END_SUBTITLE',
		}),
		days: setting.array({
			displayAs: 'checkboxes',
			of: setting.choice({
				options: {
					mon: 'MON',
					tue: 'TUE',
					wed: 'WED',
					thu: 'THU',
					fri: 'FRI',
					sat: 'SAT',
					sun: 'SUN',
				},
			}),
			default: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
			title: 'DAYS',
			subtitle: 'DAYS_SUBTITLE',
		}),
		targets: setting.array({
			displayAs: 'list',
			of: setting.string(),
			default: [],
			title: 'TARGETS',
			subtitle: 'TARGETS_SUBTITLE',
		}),
	},
	{ title: 'QUIET_HOURS' },
);
