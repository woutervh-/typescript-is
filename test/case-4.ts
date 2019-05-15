import * as assert from 'assert';
import { is } from '../index';

describe('is', () => {
    describe('is<any>', () => {
        it('should always return true', () => {
            assert.deepStrictEqual(is<any>(0), true);
            assert.deepStrictEqual(is<any>(1), true);
            assert.deepStrictEqual(is<any>(true), true);
            assert.deepStrictEqual(is<any>(false), true);
            assert.deepStrictEqual(is<any>(''), true);
            assert.deepStrictEqual(is<any>('a'), true);
            assert.deepStrictEqual(is<any>({}), true);
            assert.deepStrictEqual(is<any>([]), true);
            assert.deepStrictEqual(is<any>(null), true);
            assert.deepStrictEqual(is<any>(undefined), true);
        });
    });

    describe('is<never>', () => {
        it('should always return false', () => {
            assert.deepStrictEqual(is<never>(0), false);
            assert.deepStrictEqual(is<never>(1), false);
            assert.deepStrictEqual(is<never>(true), false);
            assert.deepStrictEqual(is<never>(false), false);
            assert.deepStrictEqual(is<never>(''), false);
            assert.deepStrictEqual(is<never>('a'), false);
            assert.deepStrictEqual(is<never>({}), false);
            assert.deepStrictEqual(is<never>([]), false);
            assert.deepStrictEqual(is<never>(null), false);
            assert.deepStrictEqual(is<never>(undefined), false);
        });
    });

    describe('is<number & boolean>', () => {
        it('should return false for numbers and booleans', () => {
            assert.deepStrictEqual(is<number & boolean>(0), false);
            assert.deepStrictEqual(is<number & boolean>(1), false);
            assert.deepStrictEqual(is<number & boolean>(-1), false);
            assert.deepStrictEqual(is<number & boolean>(Number.NaN), false);
            assert.deepStrictEqual(is<number & boolean>(true), false);
            assert.deepStrictEqual(is<number & boolean>(false), false);
        });

        it('should return false for various other objects', () => {
            assert.deepStrictEqual(is<number | boolean>(null), false);
            assert.deepStrictEqual(is<number | boolean>(undefined), false);
            assert.deepStrictEqual(is<number | boolean>({}), false);
            assert.deepStrictEqual(is<number | boolean>([]), false);
            assert.deepStrictEqual(is<number | boolean>(''), false);
            assert.deepStrictEqual(is<number | boolean>('a'), false);
        });
    });

    describe('is<Foo<number> & { secondItem: \'foo\' }>', () => {
        interface Foo<T> {
            item: T;
        }

        it('should return true for objects that match both intersection types', () => {
            assert.deepStrictEqual(is<Foo<number> & { secondItem: 'foo' }>({ item: 0, secondItem: 'foo' }), true);
            assert.deepStrictEqual(is<Foo<number> & { secondItem: 'foo' }>({ item: 1, secondItem: 'foo' }), true);
            assert.deepStrictEqual(is<Foo<number> & { secondItem: 'foo' }>({ item: -1, secondItem: 'foo' }), true);
            assert.deepStrictEqual(is<Foo<number> & { secondItem: 'foo' }>({ item: Number.NaN, secondItem: 'foo' }), true);
        });
    });
});
