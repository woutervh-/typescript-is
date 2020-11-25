import * as assert from 'assert';
import { is } from '../index';

/* https://github.com/woutervh-/typescript-is/issues/59 */

describe('is', () => {
    type Row<T> = {
        value: T;
    };

    describe('is<Row<number>>', () => {
        it('should return true for Row objects with value a number', () => {
            assert.deepStrictEqual(is<Row<number>>({ value: 0 }), true);
            assert.deepStrictEqual(is<Row<number>>({ value: 1 }), true);
            assert.deepStrictEqual(is<Row<number>>({ value: Number.NaN }), true);
        });

        it('should return false for Row objects with value not a number', () => {
            assert.deepStrictEqual(is<Row<number>>({ value: '0' }), false);
            assert.deepStrictEqual(is<Row<number>>({ value: '1' }), false);
            assert.deepStrictEqual(is<Row<number>>({ value: true }), false);
            assert.deepStrictEqual(is<Row<number>>({ value: false }), false);
            assert.deepStrictEqual(is<Row<number>>({ value: {} }), false);
            assert.deepStrictEqual(is<Row<number>>({ value: [] }), false);
            assert.deepStrictEqual(is<Row<number>>({ value: null }), false);
            assert.deepStrictEqual(is<Row<number>>({ value: undefined }), false);
        });
    });
});
