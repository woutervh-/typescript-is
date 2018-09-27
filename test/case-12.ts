import * as assert from 'assert';
import { is } from '../index';

describe('is', () => {
    describe('is<object>', () => {
        it('should return false for booleans, numbers, and strings', () => {
            assert.strictEqual(is<object>(true), false);
            assert.strictEqual(is<object>(false), false);
            assert.strictEqual(is<object>(0), false);
            assert.strictEqual(is<object>(1), false);
            assert.strictEqual(is<object>(Number.NaN), false);
            assert.strictEqual(is<object>(''), false);
            assert.strictEqual(is<object>('1'), false);
            assert.strictEqual(is<object>('foo'), false);
        });

        it('should return true for any other object', () => {
            assert.strictEqual(is<object>({}), true);
            assert.strictEqual(is<object>([]), true);
            assert.strictEqual(is<object>(new Error()), true);
            assert.strictEqual(is<object>(null), true);
            assert.strictEqual(is<object>(undefined), true);
        });
    });

    describe('is<PickValues<{ foo: number }>>', () => {
        type PickValues<T> = T[keyof T];

        interface Foo<T> {
            key: keyof T;
        }

        it('should return true for numbers', () => {
            assert.strictEqual(is<PickValues<{ foo: number }>>(0), true);
            assert.strictEqual(is<Foo<{ foo: number, bar: number }>>({ key: 'foo' }), true);
            assert.strictEqual(is<Foo<{ foo: number, bar: number }>>({ key: 'bar' }), true);
        });
    });
});
