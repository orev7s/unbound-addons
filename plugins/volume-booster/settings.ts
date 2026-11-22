import { defineSettings, setting } from '@unbound-app/settings/schema';

export default defineSettings(
	{
		enabled: setting.boolean({
			default: true,
			title: 'ENABLED',
			subtitle: 'ENABLED_SUBTITLE',
		}),
		boostDb: setting.integer({
			displayAs: 'stepper',
			min: 0,
			max: 10,
			step: 1,
			default: 6,
			title: 'BOOST_DB',
			subtitle: 'BOOST_DB_SUBTITLE',
		}),
		sources: setting.section(
			{
				title: 'SOURCES',
				subtitle: 'SOURCES_SUBTITLE',
				displayAs: 'collapsible',
			},
			{
				voiceMessages: setting.boolean({
					default: true,
					title: 'SOURCE_VOICE',
					subtitle: 'SOURCE_VOICE_SUBTITLE',
				}),
				mediaAudio: setting.boolean({
					default: true,
					title: 'SOURCE_MEDIA',
					subtitle: 'SOURCE_MEDIA_SUBTITLE',
				}),
			},
		),
	},
	{ title: 'VOLUME_BOOSTER' },
);
