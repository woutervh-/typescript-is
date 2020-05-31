import * as assert from 'assert';
import { createAssertType, createIs } from '../index';

describe('createIs', () => {
    describe('createIs<number>', () => {
        const isNumber = createIs<number>();

        it('should return a function', () => {
            assert.deepStrictEqual(typeof isNumber, 'function');
        });

        it('should return a function that returns true for numbers', () => {
            assert.deepStrictEqual(isNumber(-1), true);
            assert.deepStrictEqual(isNumber(0), true);
            assert.deepStrictEqual(isNumber(1), true);
            assert.deepStrictEqual(isNumber(Number.NaN), true);
            assert.deepStrictEqual(isNumber(Number.POSITIVE_INFINITY), true);
            assert.deepStrictEqual(isNumber(Number.NEGATIVE_INFINITY), true);
            assert.deepStrictEqual(isNumber(42), true);
        });

        it('should return a function that returns false for other objects', () => {
            assert.deepStrictEqual(isNumber(''), false);
            assert.deepStrictEqual(isNumber('1'), false);
            assert.deepStrictEqual(isNumber(true), false);
            assert.deepStrictEqual(isNumber(false), false);
            assert.deepStrictEqual(isNumber(undefined), false);
            assert.deepStrictEqual(isNumber(null), false);
            assert.deepStrictEqual(isNumber({}), false);
            assert.deepStrictEqual(isNumber([]), false);
        });
    });
});

describe('createAssertType', () => {
    describe('createAssertType<number>', () => {
        const expectedMessageRegExp = /validation failed at \$: expected a number, found: .*$/;
        const assertNumber = createAssertType<number>();

        it('should return a function', () => {
            assert.deepStrictEqual(typeof assertNumber, 'function');
        });

        it('should return a function that returns the numbers passed to it', () => {
            assert.deepStrictEqual(assertNumber(-1), -1);
            assert.deepStrictEqual(assertNumber(0), 0);
            assert.deepStrictEqual(assertNumber(1), 1);
            assert.deepStrictEqual(Number.isNaN(assertNumber(Number.NaN)), true);
            assert.deepStrictEqual(assertNumber(Number.POSITIVE_INFINITY), Number.POSITIVE_INFINITY);
        });

        it('should return a function that throws if non-numbers are passed to it', () => {
            assert.throws(() => assertNumber(''), expectedMessageRegExp);
            assert.throws(() => assertNumber('1'), expectedMessageRegExp);
            assert.throws(() => assertNumber([]), expectedMessageRegExp);
            assert.throws(() => assertNumber({}), expectedMessageRegExp);
            assert.throws(() => assertNumber(true), expectedMessageRegExp);
            assert.throws(() => assertNumber(false), expectedMessageRegExp);
            assert.throws(() => assertNumber(null), expectedMessageRegExp);
            assert.throws(() => assertNumber(undefined), expectedMessageRegExp);
        });
    });
});
