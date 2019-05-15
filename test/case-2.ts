import * as assert from 'assert';
import { is } from '../index';

describe('is', () => {
    describe('is<Foo<{ field: boolean }>>', () => {
        type Foo<T> = Pick<T, keyof T>;

        it('should return true for objects with field a boolean', () => {
            assert.deepStrictEqual(is<Foo<{ field: boolean }>>({ field: true }), true);
            assert.deepStrictEqual(is<Foo<{ field: boolean }>>({ field: false }), true);
        });

        it('should return false for objects with field a number', () => {
            assert.deepStrictEqual(is<Foo<{ field: boolean }>>({ field: 0 }), false);
            assert.deepStrictEqual(is<Foo<{ field: boolean }>>({ field: 1 }), false);
            assert.deepStrictEqual(is<Foo<{ field: boolean }>>({ field: Number.NaN }), false);
        });

        it('should return false for objects without field', () => {
            assert.deepStrictEqual(is<Foo<{ field: boolean }>>({}), false);
            assert.deepStrictEqual(is<Foo<{ field: boolean }>>({ wrong: true }), false);
            assert.deepStrictEqual(is<Foo<{ field: boolean }>>({ wrong: 0 }), false);
        });
    });

    describe('is<Bar<number>>', () => {
        type Bar<T> = {
            [K in 'key']: T;
        };

        it('should return true for objects with key a number', () => {
            assert.deepStrictEqual(is<Bar<number>>({ key: 0 }), true);
            assert.deepStrictEqual(is<Bar<number>>({ key: 1 }), true);
            assert.deepStrictEqual(is<Bar<number>>({ key: Number.NaN }), true);
        });

        it('should return false for objects without key', () => {
            assert.deepStrictEqual(is<Bar<number>>({}), false);
            assert.deepStrictEqual(is<Bar<number>>({ wrong: true }), false);
            assert.deepStrictEqual(is<Bar<number>>({ wrong: 0 }), false);
        });

        it('should return false for objects with key a string', () => {
            assert.deepStrictEqual(is<Bar<number>>({ key: '' }), false);
            assert.deepStrictEqual(is<Bar<number>>({ key: 'wrong' }), false);
        });
    });
});
