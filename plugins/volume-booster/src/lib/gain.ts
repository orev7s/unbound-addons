/** Millibels per decibel; `LoudnessEnhancer.setTargetGain` takes millibels. */
export const MILLIBELS_PER_DB = 100;

/** The loudness effect's parameter floor for a booster: 0 mB is no amplification. */
export const MIN_MILLIBELS = 0;

/** The loudness effect's ceiling, +10 dB. */
export const MAX_MILLIBELS = 1000;

/** The global output mix, the only audio session the add-on can reach today. */
export const GLOBAL_AUDIO_SESSION = 0;

/** A boost to apply to one audio session. */
export type BoostRequest = {
	/** The Android audio session id; 0 is the global output mix. */
	sessionId: number;
	/** The target gain in millibels; 0 disables the boost. */
	millibels: number;
};

/** Which audio the boost applies to. */
export type BoostSource = 'voiceMessages' | 'mediaAudio';

/** The per-source switches. */
export type BoostSources = Record<BoostSource, boolean>;

/**
 * @description Converts decibels to the millibels the effect takes.
 * @param db The gain in decibels.
 * @returns The gain in millibels, rounded.
 */
export function dbToMillibels(db: number): number {
	return Math.round(db * MILLIBELS_PER_DB);
}

/**
 * @description Limits a gain to what the effect accepts, mapping a missing value to no boost.
 * @param value The gain in millibels.
 * @returns The gain, between {@link MIN_MILLIBELS} and {@link MAX_MILLIBELS}.
 */
export function clampMillibels(value: number): number {
	if (!Number.isFinite(value)) return value > 0 ? MAX_MILLIBELS : MIN_MILLIBELS;

	return Math.min(MAX_MILLIBELS, Math.max(MIN_MILLIBELS, Math.round(value)));
}

/**
 * @description Reads a boost in decibels as the clamped millibels to hand the effect.
 * @param db The gain in decibels.
 * @returns The gain in millibels.
 */
export function boostMillibels(db: number): number {
	return clampMillibels(dbToMillibels(db));
}

/**
 * @description Tells whether any source the settings name wants the boost.
 * @param sources The per-source switches.
 * @returns Whether at least one source is on.
 */
export function anySourceEnabled(sources: BoostSources): boolean {
	return sources.voiceMessages || sources.mediaAudio;
}
