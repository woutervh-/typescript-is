/* tslint:disable:max-classes-per-file */

import * as assert from 'assert';
import { AssertParameter, ValidateClass } from '../index';

describe('@ValidateClass, @AssertParameter', () => {
    describe('@ValidateClass(), @AssertParameter() parameter: number', () => {
        const expectedMessageRegExp = /Type assertion failed.$/;

        @ValidateClass()
        class TestClass {
            testMethod(@AssertParameter() parameter: number) {
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
            assert.throws(() => instance.testMethod('' as any), expectedMessageRegExp);
            assert.throws(() => instance.testMethod('0' as any), expectedMessageRegExp);
            assert.throws(() => instance.testMethod('1' as any), expectedMessageRegExp);
            assert.throws(() => instance.testMethod(true as any), expectedMessageRegExp);
            assert.throws(() => instance.testMethod(false as any), expectedMessageRegExp);
            assert.throws(() => instance.testMethod({} as any), expectedMessageRegExp);
            assert.throws(() => instance.testMethod([] as any), expectedMessageRegExp);
        });
    });

    describe('@ValidateClass(), @AssertParameter() parameter: string', () => {
        const expectedMessageRegExp = /Type assertion failed.$/;

        @ValidateClass()
        class TestClass {
            testMethod(@AssertParameter() parameter: string) {
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
            assert.throws(() => instance.testMethod(0 as any), expectedMessageRegExp);
            assert.throws(() => instance.testMethod(1 as any), expectedMessageRegExp);
            assert.throws(() => instance.testMethod(true as any), expectedMessageRegExp);
            assert.throws(() => instance.testMethod(false as any), expectedMessageRegExp);
            assert.throws(() => instance.testMethod({} as any), expectedMessageRegExp);
            assert.throws(() => instance.testMethod([] as any), expectedMessageRegExp);
        });
    });

    describe('@ValidateClass(CustomError), @AssertParameter() parameter: boolean', () => {
        const expectedMessageRegExp = /Custom error.$/;

        class CustomError extends Error {
            constructor() {
                super('Custom error.');
            }
        }

        @ValidateClass(CustomError)
        class TestClass {
            testMethod(@AssertParameter() parameter: boolean) {
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

    describe('@ValidateClass(), @AssertParameter({ message: \'Foobar\' }) parameter: string', () => {
        const expectedMessageRegExp = /Foobar$/;

        @ValidateClass()
        class TestClass {
            testMethod(@AssertParameter({ message: 'Foobar' }) parameter: string) {
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
