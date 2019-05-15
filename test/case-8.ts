import * as assert from 'assert';
import { is } from '../index';

describe('is', () => {
    describe('is<null>', () => {
        it('should return true for the literal null', () => {
            assert.deepStrictEqual(is<null>(null), true);
        });

        it('should return false for other objects', () => {
            assert.deepStrictEqual(is<null>(undefined), false);
            assert.deepStrictEqual(is<null>(true), false);
            assert.deepStrictEqual(is<null>(1), false);
            assert.deepStrictEqual(is<null>(''), false);
            assert.deepStrictEqual(is<null>({}), false);
            assert.deepStrictEqual(is<null>([]), false);
        });
    });

    describe('is<undefined>', () => {
        it('should return true for the literal undefined', () => {
            assert.deepStrictEqual(is<undefined>(undefined), true);
        });

        it('should return false for other objects', () => {
            assert.deepStrictEqual(is<undefined>(null), false);
            assert.deepStrictEqual(is<undefined>(true), false);
            assert.deepStrictEqual(is<undefined>(1), false);
            assert.deepStrictEqual(is<undefined>(''), false);
            assert.deepStrictEqual(is<undefined>({}), false);
            assert.deepStrictEqual(is<undefined>([]), false);
        });
    });
});
