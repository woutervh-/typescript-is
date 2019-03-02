import * as assert from 'assert';
import { createIs, createAssertType } from '../index';

describe('createIs', () => {
    describe('createIs<number>', () => {
        const isNumber = createIs<number>();

        it('should return a function', () => {
            assert.strictEqual(typeof isNumber, 'function');
        });

        it('should return a function that returns true for numbers', () => {
            assert.strictEqual(isNumber(-1), true);
            assert.strictEqual(isNumber(0), true);
            assert.strictEqual(isNumber(1), true);
            assert.strictEqual(isNumber(Number.NaN), true);
            assert.strictEqual(isNumber(Number.POSITIVE_INFINITY), true);
            assert.strictEqual(isNumber(Number.NEGATIVE_INFINITY), true);
            assert.strictEqual(isNumber(42), true);
        });

        it('should return a function that returns false for other objects', () => {
            assert.strictEqual(isNumber(''), false);
            assert.strictEqual(isNumber('1'), false);
            assert.strictEqual(isNumber(true), false);
            assert.strictEqual(isNumber(false), false);
            assert.strictEqual(isNumber(undefined), false);
            assert.strictEqual(isNumber(null), false);
            assert.strictEqual(isNumber({}), false);
            assert.strictEqual(isNumber([]), false);
        });
    });
});

describe('createAssertType', () => {
    describe('createAssertType<number>', () => {
        const expectedMessageRegExp = /validation failed at \$: expected a number$/;
        const assertNumber = createAssertType<number>();

        it('should return a function', () => {
            assert.strictEqual(typeof assertNumber, 'function');
        });

        it('should return a function that returns the numbers passed to it', () => {
            assert.strictEqual(assertNumber(-1), -1);
            assert.strictEqual(assertNumber(0), 0);
            assert.strictEqual(assertNumber(1), 1);
            assert.strictEqual(Number.isNaN(assertNumber(Number.NaN)), true);
            assert.strictEqual(assertNumber(Number.POSITIVE_INFINITY), Number.POSITIVE_INFINITY);
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
