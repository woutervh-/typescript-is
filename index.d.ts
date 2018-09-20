/**
 * Checks if the given argument matches the given type-argument.
 * 
 * @param object object whose type needs to be checked.
 * @returns `true` if `object` matches `T`, false otherwise.
 */
export function is<T>(object: any): object is T;

/**
 * Asserts the given argument to be of the given type-argument.
 * If the given argument does not match the given type-argument, an error will be thrown.
 * 
 * @param object object whose type will be asserted.
 * @returns the given `object`, or an error is thrown if validation failed.
 */
export function assertType<T>(object: any): T;
