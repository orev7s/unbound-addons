import { defineSettings, setting } from '@unbound-app/settings/schema';

export default defineSettings(
	{
		direction: setting.choice({
			default: 'newest',
			title: 'DIRECTION',
			subtitle: 'DIRECTION_SUBTITLE',
			options: { newest: 'NEWEST', oldest: 'OLDEST' },
		}),
		suggestions: setting.boolean({
			default: false,
			title: 'SUGGESTIONS',
			subtitle: 'SUGGESTIONS_SUBTITLE',
		}),
	},
	{ title: 'SORT_FRIEND_REQUESTS' },
);
