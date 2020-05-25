/* tslint:disable:max-classes-per-file */

import * as assert from 'assert';
import { AssertType, ValidateClass } from '../index';

describe('@ValidateClass, @AssertType', () => {
    describe('@ValidateClass(), @AssertType() parameter: number = 50', () => {
        @ValidateClass()
        class TestClass {
            testMethod(@AssertType() parameter: number = 50) {
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

        it('should pass validation when the argument is missing or undefined', () => {
            assert.deepStrictEqual(instance.testMethod(), 50);
            assert.deepStrictEqual(instance.testMethod(undefined), 50);
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
            assert.throws(() => instance.testMethod(null as any), expectedMessageRegExp);
        });
    });

    describe('@ValidateClass(), @AssertType() parameter?: number', () => {
        @ValidateClass()
        class TestClass {
            testMethod(@AssertType() parameter?: number) {
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
            const nanResult = instance.testMethod(Number.NaN);
            assert.deepStrictEqual(typeof nanResult === 'number' && Number.isNaN(nanResult), true);
        });

        it('should pass validation when the argument is missing or undefined', () => {
            assert.deepStrictEqual(instance.testMethod(), undefined);
            assert.deepStrictEqual(instance.testMethod(undefined), undefined);
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
            assert.throws(() => instance.testMethod(null as any), expectedMessageRegExp);
        });
    });
});
