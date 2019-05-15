import * as assert from 'assert';
import { is } from '../index';

/* https://github.com/woutervh-/typescript-is/issues/4 */

describe('is', () => {
    interface Wrapped<T> {
        wrap: T;
    }

    interface X<T> {
        a: Wrapped<T>;
    }

    describe('is<X<number>>', () => {
        it('should return true for objects with property `a` that is an object with property `wrap` that is a number', () => {
            assert.deepStrictEqual(is<X<number>>({ a: { wrap: 2 } }), true);
            assert.deepStrictEqual(is<X<number>>({ a: { wrap: 0 } }), true);
            assert.deepStrictEqual(is<X<number>>({ a: { wrap: Number.NEGATIVE_INFINITY } }), true);
            assert.deepStrictEqual(is<X<number>>({ a: { wrap: Number.NaN } }), true);
        });

        it('should return true for objects with property `a` that is an object with property `wrap` that is a number and other properties', () => {
            assert.deepStrictEqual(is<X<number>>({ a: { wrap: 0, wraap: false } }), true);
            assert.deepStrictEqual(is<X<number>>({ a: { wrap: 1, foo: 'bar' } }), true);
        });

        it('should return false for objects with property `a` that is an object with property `wrap` that is not a number', () => {
            assert.deepStrictEqual(is<X<number>>({ a: { wrap: {} } }), false);
            assert.deepStrictEqual(is<X<number>>({ a: { wrap: null } }), false);
            assert.deepStrictEqual(is<X<number>>({ a: { wrap: '3' } }), false);
            assert.deepStrictEqual(is<X<number>>({ a: { wrap: true } }), false);
        });

        it('should return false for objects with property `a` that is an object without property `wrap`', () => {
            assert.deepStrictEqual(is<X<number>>({ a: {} }), false);
            assert.deepStrictEqual(is<X<number>>({ a: { wrapo: 2 } }), false);
        });

        it('should return false for objects with property `a` that is not an object', () => {
            assert.deepStrictEqual(is<X<number>>({ a: null }), false);
            assert.deepStrictEqual(is<X<number>>({ a: 2 }), false);
            assert.deepStrictEqual(is<X<number>>({ a: [] }), false);
            assert.deepStrictEqual(is<X<number>>({ a: true }), false);
        });

        it('should return false for objects without property `a`', () => {
            assert.deepStrictEqual(is<X<number>>({}), false);
            assert.deepStrictEqual(is<X<number>>({ aa: { wrap: 2 } }), false);
        });

        it('should return false for other types', () => {
            assert.deepStrictEqual(is<X<number>>([]), false);
            assert.deepStrictEqual(is<X<number>>(null), false);
            assert.deepStrictEqual(is<X<number>>(2), false);
            assert.deepStrictEqual(is<X<number>>('3'), false);
        });
    });
});
