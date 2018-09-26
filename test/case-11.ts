/* tslint:disable:max-classes-per-file */

import * as assert from 'assert';
import { AssertParameter, ValidateClass } from '../index';

describe('@ValidateClass(), @AssertParameter', () => {
    const expectedMessageRegExp = /Type assertion failed.$/;
    const expectedCustomMessageRegExp = /Custom error.$/;

    describe('@ValidateClass(), @AssertParameter parameter: number', () => {
        @ValidateClass()
        class TestClass {
            testMethod(@AssertParameter parameter: number) {
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

    describe('@ValidateClass(), @AssertParameter parameter: string', () => {
        @ValidateClass()
        class TestClass {
            testMethod(@AssertParameter parameter: string) {
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

    describe('@ValidateClass(CustomError), @AssertParameter parameter: boolean', () => {
        class CustomError extends Error {
            constructor() {
                super('Custom error.');
            }
        }

        @ValidateClass(CustomError)
        class TestClass {
            testMethod(@AssertParameter parameter: boolean) {
                return parameter;
            }
        }

        const instance = new TestClass();

        it('should pass validation for booleans', () => {
            assert.strictEqual(instance.testMethod(true), true);
            assert.strictEqual(instance.testMethod(false), false);
        });

        it('should throw an error for non-booleans', () => {
            assert.throws(() => instance.testMethod(0 as any), expectedCustomMessageRegExp);
            assert.throws(() => instance.testMethod(1 as any), expectedCustomMessageRegExp);
            assert.throws(() => instance.testMethod('' as any), expectedCustomMessageRegExp);
            assert.throws(() => instance.testMethod('true' as any), expectedCustomMessageRegExp);
            assert.throws(() => instance.testMethod({} as any), expectedCustomMessageRegExp);
            assert.throws(() => instance.testMethod([] as any), expectedCustomMessageRegExp);
        });
    });
});
