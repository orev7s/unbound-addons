import { assets, toasts } from '@unbound-app/api';
import { Discord } from '@unbound-app/api/metro/components';
import { format, messages } from '@unbound-app/i18n';
import { getActionSheetRow } from '@v80q/plugin-shared/action-sheets/action-sheet-row';

import { describeDue, PRESETS, presetDue, type PresetId } from '~/lib/reminders';
import { addReminder } from '~/lib/store';

type PresetSheetProps = { channelId: string; messageId: string; onClose: () => void };

const LABELS: Record<PresetId, () => string> = {
	'10m': () => messages.PRESET_10M,
	'1h': () => messages.PRESET_1H,
	'3h': () => messages.PRESET_3H,
	tomorrow: () => messages.PRESET_TOMORROW,
};

/**
 * @description Offers the fixed delays a reminder can be set for, saving the picked one.
 * @param props The message the reminder is about, and the sheet's own close.
 * @returns The sheet.
 */
export default function PresetSheet({ channelId, messageId, onClose }: PresetSheetProps) {
	const ActionSheetRow = getActionSheetRow();
	const clock = assets.getIdByName('ClockIcon');

	return (
		<Discord.ActionSheet>
			<Discord.Text
				variant='heading-lg/semibold'
				style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 }}
			>
				{messages.REMIND_ME}
			</Discord.Text>
			<ActionSheetRow.Group>
				{PRESETS.map((preset) => (
					<ActionSheetRow
						key={preset}
						label={LABELS[preset]()}
						icon={clock ? <ActionSheetRow.Icon source={clock} /> : undefined}
						onPress={() => {
							const due = presetDue(preset);

							addReminder(channelId, messageId, due);
							toasts.show({
								title: addon.name,
								content: format('REMINDER_SET', { when: describeDue(due) }),
							});
							onClose();
						}}
					/>
				))}
			</ActionSheetRow.Group>
		</Discord.ActionSheet>
	);
}
