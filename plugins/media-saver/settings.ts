import { defineSettings, setting } from '@unbound-app/settings/schema';

export default defineSettings(
	{
		enabled: setting.boolean({
			default: true,
			title: 'ENABLED',
			subtitle: 'ENABLED_SUBTITLE',
		}),
		allowMetered: setting.boolean({
			default: false,
			title: 'ALLOW_METERED',
			subtitle: 'ALLOW_METERED_SUBTITLE',
		}),
		images: setting.boolean({
			default: true,
			title: 'IMAGES',
			subtitle: 'IMAGES_SUBTITLE',
		}),
		gifs: setting.boolean({
			default: true,
			title: 'GIFS',
			subtitle: 'GIFS_SUBTITLE',
		}),
		videos: setting.boolean({
			default: true,
			title: 'VIDEOS',
			subtitle: 'VIDEOS_SUBTITLE',
		}),
		emojis: setting.boolean({
			default: false,
			title: 'EMOJIS',
			subtitle: 'EMOJIS_SUBTITLE',
		}),
		stickers: setting.boolean({
			default: false,
			title: 'STICKERS',
			subtitle: 'STICKERS_SUBTITLE',
		}),
	},
	{ title: 'MEDIA_SAVER' },
);
