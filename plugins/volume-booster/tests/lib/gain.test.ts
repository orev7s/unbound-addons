import { describe, expect, test } from 'bun:test';

import {
	anySourceEnabled,
	boostMillibels,
	clampMillibels,
	dbToMillibels,
	MAX_MILLIBELS,
	MIN_MILLIBELS,
} from '~/lib/gain';

describe('dbToMillibels', () => {
	test('answers 100 millibels per decibel', () => {
		expect(dbToMillibels(0)).toBe(0);
		expect(dbToMillibels(1)).toBe(100);
		expect(dbToMillibels(6)).toBe(600);
		expect(dbToMillibels(6.5)).toBe(650);
		expect(dbToMillibels(-2)).toBe(-200);
	});

	test('rounds to the nearest millibel', () => {
		expect(dbToMillibels(6.554)).toBe(655);
		expect(dbToMillibels(6.555)).toBe(656);
	});
});

describe('clampMillibels', () => {
	test('keeps values inside the effect range', () => {
		expect(clampMillibels(MIN_MILLIBELS)).toBe(0);
		expect(clampMillibels(250)).toBe(250);
		expect(clampMillibels(MAX_MILLIBELS)).toBe(1000);
	});

	test('clamps below zero and above the ceiling', () => {
		expect(clampMillibels(-5)).toBe(0);
		expect(clampMillibels(-1000)).toBe(0);
		expect(clampMillibels(5000)).toBe(1000);
	});

	test('rounds and maps a missing value to no boost', () => {
		expect(clampMillibels(600.4)).toBe(600);
		expect(clampMillibels(600.6)).toBe(601);
		expect(clampMillibels(Number.NaN)).toBe(0);
		expect(clampMillibels(Number.POSITIVE_INFINITY)).toBe(1000);
		expect(clampMillibels(Number.NEGATIVE_INFINITY)).toBe(0);
	});
});

describe('boostMillibels', () => {
	test('reads a decibel setting as clamped millibels', () => {
		expect(boostMillibels(0)).toBe(0);
		expect(boostMillibels(6)).toBe(600);
		expect(boostMillibels(10)).toBe(1000);
	});

	test('never boosts past the ceiling or below zero', () => {
		expect(boostMillibels(20)).toBe(1000);
		expect(boostMillibels(10.5)).toBe(1000);
		expect(boostMillibels(-3)).toBe(0);
	});

	test('maps a missing setting to no boost', () => {
		expect(boostMillibels(Number.NaN)).toBe(0);
	});
});

describe('anySourceEnabled', () => {
	test('is on when at least one source is on', () => {
		expect(anySourceEnabled({ voiceMessages: false, mediaAudio: false })).toBe(false);
		expect(anySourceEnabled({ voiceMessages: true, mediaAudio: false })).toBe(true);
		expect(anySourceEnabled({ voiceMessages: false, mediaAudio: true })).toBe(true);
		expect(anySourceEnabled({ voiceMessages: true, mediaAudio: true })).toBe(true);
	});
});
