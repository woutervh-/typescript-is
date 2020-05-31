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
            assert.deepStrictEqual(instance.testMethod(0), 0);
            assert.deepStrictEqual(instance.testMethod(1), 1);
            assert.deepStrictEqual(instance.testMethod(-1), -1);
            assert.deepStrictEqual(instance.testMethod(42), 42);
            assert.deepStrictEqual(instance.testMethod(Number.POSITIVE_INFINITY), Number.POSITIVE_INFINITY);
            assert.deepStrictEqual(instance.testMethod(Number.NEGATIVE_INFINITY), Number.NEGATIVE_INFINITY);
            assert.deepStrictEqual(Number.isNaN(instance.testMethod(Number.NaN)), true);
        });

        it('should throw an error for non-numbers', () => {
            const expectedMessageRegExp = /validation failed at parameter: expected a number, found: .*$/;
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
            assert.deepStrictEqual(instance.testMethod(''), '');
            assert.deepStrictEqual(instance.testMethod('42'), '42');
            assert.deepStrictEqual(instance.testMethod('true'), 'true');
            assert.deepStrictEqual(instance.testMethod('false'), 'false');
        });

        it('should throw an error for non-strings', () => {
            const expectedMessageRegExp = /validation failed at parameter: expected a string, found: .*$/;
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
            assert.deepStrictEqual(instance.testMethod(true), true);
            assert.deepStrictEqual(instance.testMethod(false), false);
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
});
