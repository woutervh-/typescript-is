import * as assert from 'assert';
import { assertType } from '../index';

describe('assertType', () => {
    describe('assertType<number>', () => {
        const expectedMessageRegExp = /validation failed at \$: expected a number, found: .*$/;

        it('should return the numbers passed to it', () => {
            assert.deepStrictEqual(assertType<number>(-1), -1);
            assert.deepStrictEqual(assertType<number>(0), 0);
            assert.deepStrictEqual(assertType<number>(1), 1);
            assert.deepStrictEqual(Number.isNaN(assertType<number>(Number.NaN)), true);
            assert.deepStrictEqual(assertType<number>(Number.POSITIVE_INFINITY), Number.POSITIVE_INFINITY);
        });

        it('should throw an error if non-numbers are passed to it', () => {
            assert.throws(() => assertType<number>(''), expectedMessageRegExp);
            assert.throws(() => assertType<number>('1'), expectedMessageRegExp);
            assert.throws(() => assertType<number>([]), expectedMessageRegExp);
            assert.throws(() => assertType<number>({}), expectedMessageRegExp);
            assert.throws(() => assertType<number>(true), expectedMessageRegExp);
            assert.throws(() => assertType<number>(false), expectedMessageRegExp);
            assert.throws(() => assertType<number>(null), expectedMessageRegExp);
            assert.throws(() => assertType<number>(undefined), /validation failed at undefined: expected a number, found: .*$/);
        });
    });
});
