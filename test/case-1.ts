import * as assert from 'assert';
import { is } from '../index';

describe('is', () => {
    describe('is<Nested<string> | Nested<number>>', () => {
        interface Nested<T> {
            value: T;
        }

        it('should return true for nested objects with strings or numbers', () => {
            assert.deepStrictEqual(is<Nested<string> | Nested<number>>({ value: 'foo' }), true);
            assert.deepStrictEqual(is<Nested<string> | Nested<number>>({ value: 123 }), true);
        });

        it('should return false for nested objects with other types', () => {
            assert.deepStrictEqual(is<Nested<string> | Nested<number>>({ value: [] }), false);
            assert.deepStrictEqual(is<Nested<string> | Nested<number>>({ value: {} }), false);
            assert.deepStrictEqual(is<Nested<string> | Nested<number>>({ value: null }), false);
            assert.deepStrictEqual(is<Nested<string> | Nested<number>>({ value: undefined }), false);
            assert.deepStrictEqual(is<Nested<string> | Nested<number>>({ value: true }), false);
            assert.deepStrictEqual(is<Nested<string> | Nested<number>>({ value: false }), false);
        });
    });

    describe('is<Foo<Bar<number>, string>>', () => {
        interface Bar<V> {
            item: V;
        }

        interface Baz<W> {
            buz: W;
        }

        interface Foo<T, U> extends Bar<U>, Baz<number> {
            type: 'cool';
            secondItem: T;
            thirdItem: Bar<Bar<boolean>>;
        }

        it('should return false for the empty object literal', () => {
            assert.deepStrictEqual(is<Foo<Bar<number>, string>>({}), false);
        });

        it('should return false for an object that only partially matches', () => {
            assert.deepStrictEqual(is<Foo<Bar<number>, string>>({ type: {}, secondItem: {}, thirdItem: {} }), false);
        });

        it('should return true for objects that match the interface', () => {
            assert.deepStrictEqual(is<Foo<Bar<number>, string>>({ item: 'string', buz: 1, type: 'cool', secondItem: { item: 2 }, thirdItem: { item: { item: true } } }), true);
            assert.deepStrictEqual(is<Foo<Bar<number>, string>>({ item: 'text', buz: 2, type: 'cool', secondItem: { item: 3 }, thirdItem: { item: { item: false } } }), true);
        });
    });

    describe('is<boolean>', () => {
        it('should return false for numbers', () => {
            assert.deepStrictEqual(is<boolean>(0), false);
            assert.deepStrictEqual(is<boolean>(1), false);
        });

        it('should return false for strings', () => {
            assert.deepStrictEqual(is<boolean>(''), false);
            assert.deepStrictEqual(is<boolean>('true'), false);
            assert.deepStrictEqual(is<boolean>('false'), false);
        });

        it('should return true for booleans', () => {
            assert.deepStrictEqual(is<boolean>(true), true);
            assert.deepStrictEqual(is<boolean>(false), true);
        });
    });

    describe('is<number>', () => {
        const isNumber = (object: any): object is number => is<number>(object);

        it('should return true for numbers', () => {
            assert.deepStrictEqual(isNumber(Number.NaN), true);
            assert.deepStrictEqual(isNumber(Number.POSITIVE_INFINITY), true);
            assert.deepStrictEqual(isNumber(Number.NEGATIVE_INFINITY), true);
            assert.deepStrictEqual(isNumber(Number.MIN_VALUE), true);
            assert.deepStrictEqual(isNumber(0), true);
            assert.deepStrictEqual(isNumber(1), true);
            assert.deepStrictEqual(isNumber(42), true);
            assert.deepStrictEqual(isNumber(-1), true);
        });

        it('should return false for strings', () => {
            assert.deepStrictEqual(isNumber('0'), false);
            assert.deepStrictEqual(isNumber('1'), false);
            assert.deepStrictEqual(isNumber('42'), false);
            assert.deepStrictEqual(isNumber('-1'), false);
        });

        it('should return false for booleans', () => {
            assert.deepStrictEqual(isNumber(true), false);
            assert.deepStrictEqual(isNumber(false), false);
        });
    });
});
