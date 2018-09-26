/**
 * Checks if the given argument matches the given type-argument.
 * 
 * @param object object whose type needs to be checked.
 * @returns `true` if `object` matches `T`, false otherwise.
 * @example
   ```
   is<number>(42); // -> true
   is<number>('foo'); // -> false
   ```
 */
export function is<T>(object: any): object is T;

/**
 * Creates a function similar to `is<T>` that can be invoked at a later point.
 * 
 * This is useful, for example, if you want to re-use the function multiple times.
 * 
 * @example
   ```
   const checkNumber = createIs<number>();
   checkNumber(42); // -> true
   checkNumber('foo'); // -> false
   ```
 */
export function createIs<T>(): (object: any) => object is T;

/**
 * Asserts the given argument to be of the given type-argument.
 * If the given argument does not match the given type-argument, an error will be thrown.
 * 
 * @param object object whose type will be asserted.
 * @returns the given `object`, or an error is thrown if validation failed.
 * @example
   ```
   const safeNumber = assertType<number>(42); // safeNumber === 42, code continues
   assertType<number>('foo'); // throws an error
   ```
 */
export function assertType<T>(object: any): T;

/**
 * Creates a function similar to `assertType<T>` that can be invoked at a later point.
 * 
 * This is useful, for example, if you want to re-use the function multiple times.
 * 
 * @example
   ```
   const assertNumber = createAssertType<number>();
   const safeNumber = assertNumber(42); // safeNumber === 42, code continues
   assertNumber('foo'); // throws an error
   ```
 */
export function createAssertType<T>(): (object: any) => T;

/**
 * Creates a type assertion and saves it in the reflection metadata of the method's class.
 * Then, when the class is decorated with `ValidateClass`, the method's arguments will be validated.
 * 
 * @param target the class prototype of the method.
 * @param propertyKey the method's name.
 * @param parameterIndex the index of the parameter in the method's signature.
 * 
 * @example
 * ```
   @ValidateClass
   class A { method(@AssertParameter value: number) { value can safely be used a number } }
   new A().method(0); // nothing happens
   new A().method('0' as any); // will throw an error
   ```
 */
export function AssertParameter(target: object, propertyKey: string | symbol, parameterIndex: number): void;

/**
 * Overrides methods in the target class with a proxy that will first validate the argument types.
 * 
 * @param target the class whose methods have parameters that should be type checked.
 * @example
 * ```
   @ValidateClass
   class A { method(@AssertParameter value: number) { value can safely be used a number } }
   new A().method(0); // nothing happens
   new A().method('0' as any); // will throw an error
   ```
 */
export function ValidateClass<TFunction extends Function>(target: TFunction): void;
