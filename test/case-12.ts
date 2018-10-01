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

        it('should return true for numbers', () => {
            assert.strictEqual(is<PickValues<{ foo: number }>>(0), true);
            assert.strictEqual(is<PickValues<{ foo: number }>>(1), true);
            assert.strictEqual(is<PickValues<{ foo: number }>>(Number.NaN), true);
            assert.strictEqual(is<PickValues<{ foo: number }>>(Number.POSITIVE_INFINITY), true);
        });

        it('should return false for non-numbers', () => {
            assert.strictEqual(is<PickValues<{ foo: number }>>(true), false);
            assert.strictEqual(is<PickValues<{ foo: number }>>(false), false);
            assert.strictEqual(is<PickValues<{ foo: number }>>('0'), false);
            assert.strictEqual(is<PickValues<{ foo: number }>>('1'), false);
            assert.strictEqual(is<PickValues<{ foo: number }>>([]), false);
            assert.strictEqual(is<PickValues<{ foo: number }>>({}), false);
            assert.strictEqual(is<PickValues<{ foo: number }>>(null), false);
            assert.strictEqual(is<PickValues<{ foo: number }>>(undefined), false);
        });
    });

    describe('is<PickValues<{ foo: number, bar: boolean }>>', () => {
        type PickValues<T> = T[keyof T];

        it('should return true for numbers and booleans', () => {
            assert.strictEqual(is<PickValues<{ foo: number, bar: boolean }>>(0), true);
            assert.strictEqual(is<PickValues<{ foo: number, bar: boolean }>>(1), true);
            assert.strictEqual(is<PickValues<{ foo: number, bar: boolean }>>(Number.NaN), true);
            assert.strictEqual(is<PickValues<{ foo: number, bar: boolean }>>(Number.POSITIVE_INFINITY), true);
            assert.strictEqual(is<PickValues<{ foo: number, bar: boolean }>>(true), true);
            assert.strictEqual(is<PickValues<{ foo: number, bar: boolean }>>(false), true);
        });

        it('should return false for non-numbers and non-booleans', () => {
            assert.strictEqual(is<PickValues<{ foo: number, bar: boolean }>>('0'), false);
            assert.strictEqual(is<PickValues<{ foo: number, bar: boolean }>>('1'), false);
            assert.strictEqual(is<PickValues<{ foo: number, bar: boolean }>>([]), false);
            assert.strictEqual(is<PickValues<{ foo: number, bar: boolean }>>({}), false);
            assert.strictEqual(is<PickValues<{ foo: number, bar: boolean }>>(null), false);
            assert.strictEqual(is<PickValues<{ foo: number, bar: boolean }>>(undefined), false);
        });
    });

    describe('is<Foo<{ foo: number }>>', () => {
        interface Foo<T> {
            key: keyof T;
        }

        it('should return true for objects with key equal to \'foo\'', () => {
            assert.strictEqual(is<Foo<{ foo: number }>>({ key: 'foo' }), true);
        });

        it('should return false for objects with key not equal to \'foo\'', () => {
            assert.strictEqual(is<Foo<{ foo: number }>>({ key: '' }), false);
            assert.strictEqual(is<Foo<{ foo: number }>>({ key: 'bar' }), false);
            assert.strictEqual(is<Foo<{ foo: number }>>({ key: 'baar' }), false);
            assert.strictEqual(is<Foo<{ foo: number }>>({ key: 0 }), false);
            assert.strictEqual(is<Foo<{ foo: number }>>({ key: null }), false);
            assert.strictEqual(is<Foo<{ foo: number }>>({ key: undefined }), false);
        });

        it('should return false for various other objects', () => {
            assert.strictEqual(is<Foo<{ foo: number }>>({}), false);
            assert.strictEqual(is<Foo<{ foo: number }>>([]), false);
            assert.strictEqual(is<Foo<{ foo: number }>>(null), false);
            assert.strictEqual(is<Foo<{ foo: number }>>(undefined), false);
            assert.strictEqual(is<Foo<{ foo: number }>>(true), false);
            assert.strictEqual(is<Foo<{ foo: number }>>(false), false);
        });
    });

    describe('is<Foo<{ foo: number, bar: boolean }>>', () => {
        interface Foo<T> {
            key: keyof T;
        }

        it('should return true for objects with key being one of \'foo\' or \'bar\'', () => {
            assert.strictEqual(is<Foo<{ foo: number, bar: boolean }>>({ key: 'foo' }), true);
            assert.strictEqual(is<Foo<{ foo: number, bar: boolean }>>({ key: 'bar' }), true);
        });

        it('should return false for objects with key being neither \'foo\' nor \'bar\'', () => {
            assert.strictEqual(is<Foo<{ foo: number, bar: boolean }>>({ key: '' }), false);
            assert.strictEqual(is<Foo<{ foo: number, bar: boolean }>>({ key: 'baar' }), false);
            assert.strictEqual(is<Foo<{ foo: number, bar: boolean }>>({ key: 0 }), false);
            assert.strictEqual(is<Foo<{ foo: number, bar: boolean }>>({ key: null }), false);
            assert.strictEqual(is<Foo<{ foo: number, bar: boolean }>>({ key: undefined }), false);
        });

        it('should return false for various other objects', () => {
            assert.strictEqual(is<Foo<{ foo: number, bar: boolean }>>({}), false);
            assert.strictEqual(is<Foo<{ foo: number, bar: boolean }>>([]), false);
            assert.strictEqual(is<Foo<{ foo: number, bar: boolean }>>(null), false);
            assert.strictEqual(is<Foo<{ foo: number, bar: boolean }>>(undefined), false);
            assert.strictEqual(is<Foo<{ foo: number, bar: boolean }>>(true), false);
            assert.strictEqual(is<Foo<{ foo: number, bar: boolean }>>(false), false);
        });
    });
});
