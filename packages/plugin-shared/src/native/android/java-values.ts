import type {
	NativeJavaHandleValue,
	NativeJavaReference,
	NativeJavaValue,
} from '@unbound-app/api/native';

/**
 * @description Tags a number as a Java `int`.
 * @param value The number.
 * @returns The tagged value.
 */
export function javaInt(value: number): NativeJavaValue {
	'worklet';

	return { type: 'int', value: Math.trunc(value) };
}

/**
 * @description Tags a string as a Java `String`.
 * @param value The string.
 * @returns The tagged value.
 */
export function javaString(value: string): NativeJavaValue {
	'worklet';

	return { type: 'string', value };
}

/**
 * @description Tells whether a Java result is an object handle.
 * @param value The result.
 * @returns `true` for a handle, which can be passed back as a target or argument.
 */
export function isJavaHandle(
	value: NativeJavaValue | null | undefined,
): value is NativeJavaHandleValue {
	'worklet';

	return value?.type === 'handle';
}

/**
 * @description Reads a Java result as an object reference.
 * @param value The result.
 * @returns The handle, or `null` for Java `null` and non-object results.
 */
export function javaReference(
	value: NativeJavaValue | null | undefined,
): NativeJavaReference | null {
	'worklet';

	return isJavaHandle(value) ? value : null;
}

export default { isJavaHandle, javaInt, javaReference, javaString };
