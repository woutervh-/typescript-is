import * as assert from 'assert';
import { is } from '../index';

describe('is', () => {
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
            assert.strictEqual(is<Foo<Bar<number>, string>>({}), false);
        });

        it('should return false for an object that only partially matches', () => {
            assert.strictEqual(is<Foo<Bar<number>, string>>({ type: {}, secondItem: {}, thirdItem: {} }), false);
        });

        it('should return true for objects that match the interface', () => {
            assert.strictEqual(is<Foo<Bar<number>, string>>({ item: 'string', buz: 1, type: 'cool', secondItem: { item: 2 }, thirdItem: { item: { item: true } } }), true);
            assert.strictEqual(is<Foo<Bar<number>, string>>({ item: 'text', buz: 2, type: 'cool', secondItem: { item: 3 }, thirdItem: { item: { item: false } } }), true);
        });
    });

    describe('is<boolean>', () => {
        it('should return false for numbers', () => {
            assert.strictEqual(is<boolean>(0), false);
            assert.strictEqual(is<boolean>(1), false);
        });

        it('should return false for strings', () => {
            assert.strictEqual(is<boolean>(''), false);
            assert.strictEqual(is<boolean>('true'), false);
            assert.strictEqual(is<boolean>('false'), false);
        });

        it('should return true for booleans', () => {
            assert.strictEqual(is<boolean>(true), true);
            assert.strictEqual(is<boolean>(false), true);
        });
    });

    describe('is<number>', () => {
        const isNumber = (object: any): object is number => is<number>(object);

        it('should return true for numbers', () => {
            assert.strictEqual(isNumber(Number.NaN), true);
            assert.strictEqual(isNumber(Number.POSITIVE_INFINITY), true);
            assert.strictEqual(isNumber(Number.NEGATIVE_INFINITY), true);
            assert.strictEqual(isNumber(Number.MIN_VALUE), true);
            assert.strictEqual(isNumber(0), true);
            assert.strictEqual(isNumber(1), true);
            assert.strictEqual(isNumber(42), true);
            assert.strictEqual(isNumber(-1), true);
        });

        it('should return false for strings', () => {
            assert.strictEqual(isNumber('0'), false);
            assert.strictEqual(isNumber('1'), false);
            assert.strictEqual(isNumber('42'), false);
            assert.strictEqual(isNumber('-1'), false);
        });

        it('should return false for booleans', () => {
            assert.strictEqual(isNumber(true), false);
            assert.strictEqual(isNumber(false), false);
        });
    });
});
