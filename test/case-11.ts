/* tslint:disable:max-classes-per-file */

import * as assert from 'assert';
import { AssertType, ValidateClass } from '../index';

describe('@ValidateClass, @AssertType', () => {
    describe('@ValidateClass(), @AssertType() parameter: number', () => {
        @ValidateClass()
        class TestClass {
            testMethod(@AssertType() parameter: number) {
                return parameter;
            }
        }
        const instance = new TestClass();

        it('should pass validation for numbers', () => {
            assert.strictEqual(instance.testMethod(0), 0);
            assert.strictEqual(instance.testMethod(1), 1);
            assert.strictEqual(instance.testMethod(-1), -1);
            assert.strictEqual(instance.testMethod(42), 42);
            assert.strictEqual(instance.testMethod(Number.POSITIVE_INFINITY), Number.POSITIVE_INFINITY);
            assert.strictEqual(instance.testMethod(Number.NEGATIVE_INFINITY), Number.NEGATIVE_INFINITY);
            assert.strictEqual(Number.isNaN(instance.testMethod(Number.NaN)), true);
        });

        it('should throw an error for non-numbers', () => {
            const expectedMessageRegExp = /validation failed at \$: expected a number$/;
            assert.throws(() => instance.testMethod('' as any), expectedMessageRegExp);
            assert.throws(() => instance.testMethod('0' as any), expectedMessageRegExp);
            assert.throws(() => instance.testMethod('1' as any), expectedMessageRegExp);
            assert.throws(() => instance.testMethod(true as any), expectedMessageRegExp);
            assert.throws(() => instance.testMethod(false as any), expectedMessageRegExp);
            assert.throws(() => instance.testMethod({} as any), expectedMessageRegExp);
            assert.throws(() => instance.testMethod([] as any), expectedMessageRegExp);
        });
    });

    describe('@ValidateClass(), @AssertType() parameter: string', () => {
        @ValidateClass()
        class TestClass {
            testMethod(@AssertType() parameter: string) {
                return parameter;
            }
        }
        const instance = new TestClass();

        it('should pass validation for strings', () => {
            assert.strictEqual(instance.testMethod(''), '');
            assert.strictEqual(instance.testMethod('42'), '42');
            assert.strictEqual(instance.testMethod('true'), 'true');
            assert.strictEqual(instance.testMethod('false'), 'false');
        });

        it('should throw an error for non-strings', () => {
            const expectedMessageRegExp = /validation failed at \$: expected a string$/;
            assert.throws(() => instance.testMethod(0 as any), expectedMessageRegExp);
            assert.throws(() => instance.testMethod(1 as any), expectedMessageRegExp);
            assert.throws(() => instance.testMethod(true as any), expectedMessageRegExp);
            assert.throws(() => instance.testMethod(false as any), expectedMessageRegExp);
            assert.throws(() => instance.testMethod({} as any), expectedMessageRegExp);
            assert.throws(() => instance.testMethod([] as any), expectedMessageRegExp);
        });
    });

    describe('@ValidateClass(CustomError), @AssertType() parameter: boolean', () => {
        const expectedMessageRegExp = /Custom error.$/;

        class CustomError extends Error {
            constructor() {
                super('Custom error.');
            }
        }

        @ValidateClass(CustomError)
        class TestClass {
            testMethod(@AssertType() parameter: boolean) {
                return parameter;
            }
        }

        const instance = new TestClass();

        it('should pass validation for booleans', () => {
            assert.strictEqual(instance.testMethod(true), true);
            assert.strictEqual(instance.testMethod(false), false);
        });

        it('should throw an error for non-booleans', () => {
            assert.throws(() => instance.testMethod(0 as any), expectedMessageRegExp);
            assert.throws(() => instance.testMethod(1 as any), expectedMessageRegExp);
            assert.throws(() => instance.testMethod('' as any), expectedMessageRegExp);
            assert.throws(() => instance.testMethod('true' as any), expectedMessageRegExp);
            assert.throws(() => instance.testMethod({} as any), expectedMessageRegExp);
            assert.throws(() => instance.testMethod([] as any), expectedMessageRegExp);
        });
    });

    describe('@ValidateClass(), @AssertType({ message: \'Foobar\' }) parameter: string', () => {
        const expectedMessageRegExp = /Foobar$/;

        @ValidateClass()
        class TestClass {
            testMethod(@AssertType({ message: 'Foobar' }) parameter: string) {
                return parameter;
            }
        }

        const instance = new TestClass();

        it('should pass validation for strings', () => {
            assert.strictEqual(instance.testMethod(''), '');
            assert.strictEqual(instance.testMethod('0'), '0');
            assert.strictEqual(instance.testMethod('1'), '1');
            assert.strictEqual(instance.testMethod('foo'), 'foo');
        });

        it('should throw an error for non-strings with the provided custom message', () => {
            assert.throws(() => instance.testMethod(0 as any), expectedMessageRegExp);
            assert.throws(() => instance.testMethod(1 as any), expectedMessageRegExp);
            assert.throws(() => instance.testMethod(true as any), expectedMessageRegExp);
            assert.throws(() => instance.testMethod(false as any), expectedMessageRegExp);
            assert.throws(() => instance.testMethod({} as any), expectedMessageRegExp);
            assert.throws(() => instance.testMethod([] as any), expectedMessageRegExp);
        });
    });
});
