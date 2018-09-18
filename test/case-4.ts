import * as assert from 'assert';
import { is } from '../index';

describe('is', () => {
    describe('is<never>', () => {
        it('should always return false', () => {
            assert.strictEqual(is<never>(0), false);
            assert.strictEqual(is<never>(1), false);
            assert.strictEqual(is<never>(true), false);
            assert.strictEqual(is<never>(false), false);
            assert.strictEqual(is<never>(''), false);
            assert.strictEqual(is<never>('a'), false);
            assert.strictEqual(is<never>({}), false);
            assert.strictEqual(is<never>([]), false);
            assert.strictEqual(is<never>(null), false);
            assert.strictEqual(is<never>(undefined), false);
        });
    });

    describe('is<number & boolean>', () => {
        it('should return false for numbers and booleans', () => {
            assert.strictEqual(is<number & boolean>(0), false);
            assert.strictEqual(is<number & boolean>(1), false);
            assert.strictEqual(is<number & boolean>(-1), false);
            assert.strictEqual(is<number & boolean>(Number.NaN), false);
            assert.strictEqual(is<number & boolean>(true), false);
            assert.strictEqual(is<number & boolean>(false), false);
        });

        it('should return false for various other objects', () => {
            assert.strictEqual(is<number | boolean>(null), false);
            assert.strictEqual(is<number | boolean>(undefined), false);
            assert.strictEqual(is<number | boolean>({}), false);
            assert.strictEqual(is<number | boolean>([]), false);
            assert.strictEqual(is<number | boolean>(''), false);
            assert.strictEqual(is<number | boolean>('a'), false);
        });
    });

    describe('is<Foo<number> & { secondItem: \'foo\' }>', () => {
        interface Foo<T> {
            item: T;
        }

        it('should return true for objects that match both intersection types', () => {
            assert.strictEqual(is<Foo<number> & { secondItem: 'foo' }>({ item: 0, secondItem: 'foo' }), true);
            assert.strictEqual(is<Foo<number> & { secondItem: 'foo' }>({ item: 1, secondItem: 'foo' }), true);
            assert.strictEqual(is<Foo<number> & { secondItem: 'foo' }>({ item: -1, secondItem: 'foo' }), true);
            assert.strictEqual(is<Foo<number> & { secondItem: 'foo' }>({ item: Number.NaN, secondItem: 'foo' }), true);
        });
    });
});
