import * as assert from 'assert';
import { is } from '../index';

describe('is', () => {
    interface ReusedGeneric<T> {
        value: T;
    }

    describe('is<ReusedGeneric<number>>', () => {
        it('should return true for objects with value a number', () => {
            assert.deepStrictEqual(is<ReusedGeneric<number>>({ value: 0 }), true);
            assert.deepStrictEqual(is<ReusedGeneric<number>>({ value: 1 }), true);
            assert.deepStrictEqual(is<ReusedGeneric<number>>({ value: Number.NaN }), true);
        });

        it('should return false for objects with value not a number', () => {
            assert.deepStrictEqual(is<ReusedGeneric<number>>({ value: 'string' }), false);
            assert.deepStrictEqual(is<ReusedGeneric<number>>({ value: true }), false);
            assert.deepStrictEqual(is<ReusedGeneric<number>>({ value: {} }), false);
        });
    });

    describe('is<ReusedGeneric<string>>', () => {
        it('should return true for objects with value a string', () => {
            assert.deepStrictEqual(is<ReusedGeneric<string>>({ value: '' }), true);
            assert.deepStrictEqual(is<ReusedGeneric<string>>({ value: 'string' }), true);
        });

        it('should return false for objects with value not a string', () => {
            assert.deepStrictEqual(is<ReusedGeneric<string>>({ value: 0 }), false);
            assert.deepStrictEqual(is<ReusedGeneric<string>>({ value: 1 }), false);
            assert.deepStrictEqual(is<ReusedGeneric<string>>({ value: true }), false);
            assert.deepStrictEqual(is<ReusedGeneric<string>>({ value: {} }), false);
        });
    });
});
