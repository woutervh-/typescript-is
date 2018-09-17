import * as assert from 'assert';
import { is } from '../index';

type Bar<T> = {
    [K in 'key']: T;
};

type Foo<T> = Pick<T, keyof T>;

describe('is', () => {
    describe('is<Foo<{ field: boolean }>>', () => {
        it('should return true for objects with field a boolean', () => {
            assert.strictEqual(is<Foo<{ field: boolean }>>({ field: true }), true);
            assert.strictEqual(is<Foo<{ field: boolean }>>({ field: false }), true);
        });

        it('should return false for objects with field a number', () => {
            assert.strictEqual(is<Foo<{ field: boolean }>>({ field: 0 }), false);
            assert.strictEqual(is<Foo<{ field: boolean }>>({ field: 1 }), false);
            assert.strictEqual(is<Foo<{ field: boolean }>>({ field: Number.NaN }), false);
        });

        it('should return false for objects without field', () => {
            assert.strictEqual(is<Foo<{ field: boolean }>>({}), false);
            assert.strictEqual(is<Foo<{ field: boolean }>>({ wrong: true }), false);
            assert.strictEqual(is<Foo<{ field: boolean }>>({ wrong: 0 }), false);
        });
    });

    describe('is<Bar<number>>', () => {
        it('should return true for objects with key a number', () => {
            assert.strictEqual(is<Bar<number>>({ key: 0 }), true);
            assert.strictEqual(is<Bar<number>>({ key: 1 }), true);
            assert.strictEqual(is<Bar<number>>({ key: Number.NaN }), true);
        });

        it('should return false for objects without key', () => {
            assert.strictEqual(is<Bar<number>>({}), false);
            assert.strictEqual(is<Bar<number>>({ wrong: true }), false);
            assert.strictEqual(is<Bar<number>>({ wrong: 0 }), false);
        });

        it('should return false for objects with key a string', () => {
            assert.strictEqual(is<Bar<number>>({ key: '' }), false);
            assert.strictEqual(is<Bar<number>>({ key: 'wrong' }), false);
        });
    });
});
