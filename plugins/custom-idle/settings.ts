import { defineSettings, setting } from '@unbound-app/settings/schema';

export default defineSettings(
	{
		enabled: setting.boolean({
			default: true,
			title: 'ENABLED',
			subtitle: 'ENABLED_SUBTITLE',
		}),
		targetStatus: setting.choice({
			default: 'idle',
			title: 'TARGET_STATUS',
			subtitle: 'TARGET_STATUS_SUBTITLE',
			options: {
				idle: 'STATUS_IDLE',
				dnd: 'STATUS_DND',
				invisible: 'STATUS_INVISIBLE',
			},
		}),
		idleDelay: setting.number({
			displayAs: 'duration',
			units: ['s', 'm', 'h'],
			min: 10_000,
			default: 300_000,
			title: 'IDLE_DELAY',
			subtitle: 'IDLE_DELAY_SUBTITLE',
		}),
		onlyWhenBackgrounded: setting.boolean({
			default: true,
			title: 'ONLY_BACKGROUNDED',
			subtitle: 'ONLY_BACKGROUNDED_SUBTITLE',
		}),
		onlyWhenNotInVoice: setting.boolean({
			default: true,
			title: 'NOT_IN_VOICE',
			subtitle: 'NOT_IN_VOICE_SUBTITLE',
		}),
		excludeWhileActivityRunning: setting.boolean({
			default: false,
			title: 'EXCLUDE_ACTIVITY',
			subtitle: 'EXCLUDE_ACTIVITY_SUBTITLE',
		}),
		resetOnMessage: setting.boolean({
			default: true,
			title: 'RESET_ON_MESSAGE',
			subtitle: 'RESET_ON_MESSAGE_SUBTITLE',
		}),
		activeHours: setting.section(
			{
				title: 'ACTIVE_HOURS',
				subtitle: 'ACTIVE_HOURS_SUBTITLE',
				displayAs: 'collapsible',
			},
			{
				enabled: setting.boolean({
					default: false,
					title: 'ACTIVE_HOURS_ENABLED',
					subtitle: 'ACTIVE_HOURS_ENABLED_SUBTITLE',
				}),
				start: setting.string({
					displayAs: 'input',
					default: '09:00',
					title: 'HOURS_START',
					placeholder: 'HOURS_PLACEHOLDER',
					visibleWhen: (settings) => settings.activeHours.enabled,
				}),
				end: setting.string({
					displayAs: 'input',
					default: '17:00',
					title: 'HOURS_END',
					placeholder: 'HOURS_PLACEHOLDER',
					visibleWhen: (settings) => settings.activeHours.enabled,
				}),
			},
		),
		quietHours: setting.section(
			{
				title: 'QUIET_HOURS',
				subtitle: 'QUIET_HOURS_SUBTITLE',
				displayAs: 'collapsible',
			},
			{
				enabled: setting.boolean({
					default: false,
					title: 'QUIET_HOURS_ENABLED',
					subtitle: 'QUIET_HOURS_ENABLED_SUBTITLE',
				}),
				start: setting.string({
					displayAs: 'input',
					default: '22:00',
					title: 'HOURS_START',
					placeholder: 'HOURS_PLACEHOLDER',
					visibleWhen: (settings) => settings.quietHours.enabled,
				}),
				end: setting.string({
					displayAs: 'input',
					default: '08:00',
					title: 'HOURS_END',
					placeholder: 'HOURS_PLACEHOLDER',
					visibleWhen: (settings) => settings.quietHours.enabled,
				}),
				status: setting.choice({
					default: 'dnd',
					title: 'QUIET_STATUS',
					subtitle: 'QUIET_STATUS_SUBTITLE',
					options: {
						idle: 'STATUS_IDLE',
						dnd: 'STATUS_DND',
						invisible: 'STATUS_INVISIBLE',
					},
					visibleWhen: (settings) => settings.quietHours.enabled,
				}),
			},
		),
	},
	{ title: 'CUSTOM_IDLE' },
);
