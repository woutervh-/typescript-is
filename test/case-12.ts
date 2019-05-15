import * as assert from 'assert';
import { is } from '../index';

describe('is', () => {
    describe('is<object>', () => {
        it('should return false for booleans, numbers, strings, null and undefined', () => {
            assert.deepStrictEqual(is<object>(true), false);
            assert.deepStrictEqual(is<object>(false), false);
            assert.deepStrictEqual(is<object>(0), false);
            assert.deepStrictEqual(is<object>(1), false);
            assert.deepStrictEqual(is<object>(Number.NaN), false);
            assert.deepStrictEqual(is<object>(''), false);
            assert.deepStrictEqual(is<object>('1'), false);
            assert.deepStrictEqual(is<object>('foo'), false);
            assert.deepStrictEqual(is<object>(null), false);
            assert.deepStrictEqual(is<object>(undefined), false);
        });

        it('should return true for any other object', () => {
            assert.deepStrictEqual(is<object>({}), true);
            assert.deepStrictEqual(is<object>([]), true);
            assert.deepStrictEqual(is<object>(new Error()), true);
        });
    });

    describe('is<PickValues<{ foo: number }>>', () => {
        type PickValues<T> = T[keyof T];

        it('should return true for numbers', () => {
            assert.deepStrictEqual(is<PickValues<{ foo: number }>>(0), true);
            assert.deepStrictEqual(is<PickValues<{ foo: number }>>(1), true);
            assert.deepStrictEqual(is<PickValues<{ foo: number }>>(Number.NaN), true);
            assert.deepStrictEqual(is<PickValues<{ foo: number }>>(Number.POSITIVE_INFINITY), true);
        });

        it('should return false for non-numbers', () => {
            assert.deepStrictEqual(is<PickValues<{ foo: number }>>(true), false);
            assert.deepStrictEqual(is<PickValues<{ foo: number }>>(false), false);
            assert.deepStrictEqual(is<PickValues<{ foo: number }>>('0'), false);
            assert.deepStrictEqual(is<PickValues<{ foo: number }>>('1'), false);
            assert.deepStrictEqual(is<PickValues<{ foo: number }>>([]), false);
            assert.deepStrictEqual(is<PickValues<{ foo: number }>>({}), false);
            assert.deepStrictEqual(is<PickValues<{ foo: number }>>(null), false);
            assert.deepStrictEqual(is<PickValues<{ foo: number }>>(undefined), false);
        });
    });

    describe('is<PickValues<{ foo: number, bar: boolean }>>', () => {
        type PickValues<T> = T[keyof T];

        it('should return true for numbers and booleans', () => {
            assert.deepStrictEqual(is<PickValues<{ foo: number, bar: boolean }>>(0), true);
            assert.deepStrictEqual(is<PickValues<{ foo: number, bar: boolean }>>(1), true);
            assert.deepStrictEqual(is<PickValues<{ foo: number, bar: boolean }>>(Number.NaN), true);
            assert.deepStrictEqual(is<PickValues<{ foo: number, bar: boolean }>>(Number.POSITIVE_INFINITY), true);
            assert.deepStrictEqual(is<PickValues<{ foo: number, bar: boolean }>>(true), true);
            assert.deepStrictEqual(is<PickValues<{ foo: number, bar: boolean }>>(false), true);
        });

        it('should return false for non-numbers and non-booleans', () => {
            assert.deepStrictEqual(is<PickValues<{ foo: number, bar: boolean }>>('0'), false);
            assert.deepStrictEqual(is<PickValues<{ foo: number, bar: boolean }>>('1'), false);
            assert.deepStrictEqual(is<PickValues<{ foo: number, bar: boolean }>>([]), false);
            assert.deepStrictEqual(is<PickValues<{ foo: number, bar: boolean }>>({}), false);
            assert.deepStrictEqual(is<PickValues<{ foo: number, bar: boolean }>>(null), false);
            assert.deepStrictEqual(is<PickValues<{ foo: number, bar: boolean }>>(undefined), false);
        });
    });

    describe('is<PickKey<{ foo: number }>>', () => {
        interface PickKey<T> {
            key: keyof T;
        }

        it('should return true for objects with key equal to \'foo\'', () => {
            assert.deepStrictEqual(is<PickKey<{ foo: number }>>({ key: 'foo' }), true);
        });

        it('should return false for objects with key not equal to \'foo\'', () => {
            assert.deepStrictEqual(is<PickKey<{ foo: number }>>({ key: '' }), false);
            assert.deepStrictEqual(is<PickKey<{ foo: number }>>({ key: 'bar' }), false);
            assert.deepStrictEqual(is<PickKey<{ foo: number }>>({ key: 'baar' }), false);
            assert.deepStrictEqual(is<PickKey<{ foo: number }>>({ key: 0 }), false);
            assert.deepStrictEqual(is<PickKey<{ foo: number }>>({ key: null }), false);
            assert.deepStrictEqual(is<PickKey<{ foo: number }>>({ key: undefined }), false);
        });

        it('should return false for various other objects', () => {
            assert.deepStrictEqual(is<PickKey<{ foo: number }>>({}), false);
            assert.deepStrictEqual(is<PickKey<{ foo: number }>>([]), false);
            assert.deepStrictEqual(is<PickKey<{ foo: number }>>(null), false);
            assert.deepStrictEqual(is<PickKey<{ foo: number }>>(undefined), false);
            assert.deepStrictEqual(is<PickKey<{ foo: number }>>(true), false);
            assert.deepStrictEqual(is<PickKey<{ foo: number }>>(false), false);
        });
    });

    describe('is<PickKey<{ foo: number, bar: boolean }>>', () => {
        interface PickKey<T> {
            key: keyof T;
        }

        it('should return true for objects with key being one of \'foo\' or \'bar\'', () => {
            assert.deepStrictEqual(is<PickKey<{ foo: number, bar: boolean }>>({ key: 'foo' }), true);
            assert.deepStrictEqual(is<PickKey<{ foo: number, bar: boolean }>>({ key: 'bar' }), true);
        });

        it('should return false for objects with key being neither \'foo\' nor \'bar\'', () => {
            assert.deepStrictEqual(is<PickKey<{ foo: number, bar: boolean }>>({ key: '' }), false);
            assert.deepStrictEqual(is<PickKey<{ foo: number, bar: boolean }>>({ key: 'baar' }), false);
            assert.deepStrictEqual(is<PickKey<{ foo: number, bar: boolean }>>({ key: 0 }), false);
            assert.deepStrictEqual(is<PickKey<{ foo: number, bar: boolean }>>({ key: null }), false);
            assert.deepStrictEqual(is<PickKey<{ foo: number, bar: boolean }>>({ key: undefined }), false);
        });

        it('should return false for various other objects', () => {
            assert.deepStrictEqual(is<PickKey<{ foo: number, bar: boolean }>>({}), false);
            assert.deepStrictEqual(is<PickKey<{ foo: number, bar: boolean }>>([]), false);
            assert.deepStrictEqual(is<PickKey<{ foo: number, bar: boolean }>>(null), false);
            assert.deepStrictEqual(is<PickKey<{ foo: number, bar: boolean }>>(undefined), false);
            assert.deepStrictEqual(is<PickKey<{ foo: number, bar: boolean }>>(true), false);
            assert.deepStrictEqual(is<PickKey<{ foo: number, bar: boolean }>>(false), false);
        });
    });

    describe('is<IndexedPick<{ key: \'value\' }>>', () => {
        interface IndexedPick<T> {
            key: keyof T;
            value: T[keyof T];
        }

        it('should return true for objects with key equal to \'key\' and value equal to \'value\'', () => {
            assert.deepStrictEqual(is<IndexedPick<{ key: 'value' }>>({ key: 'key', value: 'value' }), true);
            assert.deepStrictEqual(is<IndexedPick<{ key: 'value' }>>({ key: 'key', value: 'value', another: 'another' }), true);
        });

        it('should return false for objects with key not equal to \'key\' or value not equal to \'value\'', () => {
            assert.deepStrictEqual(is<IndexedPick<{ key: 'value' }>>({ key: 'key', value: 'key' }), false);
            assert.deepStrictEqual(is<IndexedPick<{ key: 'value' }>>({ key: 'value', value: 'key' }), false);
            assert.deepStrictEqual(is<IndexedPick<{ key: 'value' }>>({ key: 'value', value: 'value' }), false);
        });

        it('should return false for objects without key or value', () => {
            assert.deepStrictEqual(is<IndexedPick<{ key: 'value' }>>({}), false);
            assert.deepStrictEqual(is<IndexedPick<{ key: 'value' }>>({ key: 'key' }), false);
            assert.deepStrictEqual(is<IndexedPick<{ key: 'value' }>>({ value: 'value' }), false);
        });

        it('should return false for other non-objects', () => {
            assert.deepStrictEqual(is<IndexedPick<{ key: 'value' }>>(null), false);
            assert.deepStrictEqual(is<IndexedPick<{ key: 'value' }>>(undefined), false);
            assert.deepStrictEqual(is<IndexedPick<{ key: 'value' }>>([]), false);
            assert.deepStrictEqual(is<IndexedPick<{ key: 'value' }>>(true), false);
            assert.deepStrictEqual(is<IndexedPick<{ key: 'value' }>>(0), false);
            assert.deepStrictEqual(is<IndexedPick<{ key: 'value' }>>('string'), false);
        });
    });

    describe('is<IndexedLiteralPick<{ key: \'value1\' | \'value2\' }>>', () => {
        interface IndexedLiteralPick<T extends { key: any }> {
            key: keyof T;
            value: T['key'];
        }

        it('should return true for objects with key equal to \'key\' and value equal to \'value1\' or \'value2\'', () => {
            assert.deepStrictEqual(is<IndexedLiteralPick<{ key: 'value1' | 'value2' }>>({ key: 'key', value: 'value1' }), true);
            assert.deepStrictEqual(is<IndexedLiteralPick<{ key: 'value1' | 'value2' }>>({ key: 'key', value: 'value2' }), true);
            assert.deepStrictEqual(is<IndexedLiteralPick<{ key: 'value1' | 'value2' }>>({ key: 'key', value: 'value1', another: 'another' }), true);
        });

        it('should return false for objects with key not equal to \'key\' or value not equal to \'value1\' or \'value2\'', () => {
            assert.deepStrictEqual(is<IndexedLiteralPick<{ key: 'value1' | 'value2' }>>({ key: 'value1', value: 'key' }), false);
            assert.deepStrictEqual(is<IndexedLiteralPick<{ key: 'value1' | 'value2' }>>({ key: 'keh', value: 'value1' }), false);
            assert.deepStrictEqual(is<IndexedLiteralPick<{ key: 'value1' | 'value2' }>>({ key: 'key', value: 'value3' }), false);
        });

        it('should return false for objects without key or value', () => {
            assert.deepStrictEqual(is<IndexedLiteralPick<{ key: 'value1' | 'value2' }>>({}), false);
            assert.deepStrictEqual(is<IndexedLiteralPick<{ key: 'value1' | 'value2' }>>({ key: 'key' }), false);
            assert.deepStrictEqual(is<IndexedLiteralPick<{ key: 'value1' | 'value2' }>>({ value: 'value1' }), false);
        });

        it('should return false for other non-objects', () => {
            assert.deepStrictEqual(is<IndexedLiteralPick<{ key: 'value1' | 'value2' }>>(null), false);
            assert.deepStrictEqual(is<IndexedLiteralPick<{ key: 'value1' | 'value2' }>>(undefined), false);
            assert.deepStrictEqual(is<IndexedLiteralPick<{ key: 'value1' | 'value2' }>>([]), false);
            assert.deepStrictEqual(is<IndexedLiteralPick<{ key: 'value1' | 'value2' }>>(true), false);
            assert.deepStrictEqual(is<IndexedLiteralPick<{ key: 'value1' | 'value2' }>>(0), false);
            assert.deepStrictEqual(is<IndexedLiteralPick<{ key: 'value1' | 'value2' }>>('string'), false);
        });
    });

    describe('is<{ foo: number }[\'foo\']>', () => {
        it('should return true for numbers', () => {
            assert.deepStrictEqual(is<{ foo: number }['foo']>(-1), true);
            assert.deepStrictEqual(is<{ foo: number }['foo']>(0), true);
            assert.deepStrictEqual(is<{ foo: number }['foo']>(1), true);
            assert.deepStrictEqual(is<{ foo: number }['foo']>(42), true);
            assert.deepStrictEqual(is<{ foo: number }['foo']>(Number.NaN), true);
            assert.deepStrictEqual(is<{ foo: number }['foo']>(Number.POSITIVE_INFINITY), true);
        });

        it('should return false for non-numbers', () => {
            assert.deepStrictEqual(is<{ foo: number }['foo']>(''), false);
            assert.deepStrictEqual(is<{ foo: number }['foo']>('0'), false);
            assert.deepStrictEqual(is<{ foo: number }['foo']>('1'), false);
            assert.deepStrictEqual(is<{ foo: number }['foo']>(true), false);
            assert.deepStrictEqual(is<{ foo: number }['foo']>(false), false);
            assert.deepStrictEqual(is<{ foo: number }['foo']>(null), false);
            assert.deepStrictEqual(is<{ foo: number }['foo']>(undefined), false);
            assert.deepStrictEqual(is<{ foo: number }['foo']>({}), false);
            assert.deepStrictEqual(is<{ foo: number }['foo']>([]), false);
        });
    });

    describe('is<keyof { foo: \'bar\' }>', () => {
        it('should return true for the string \'foo\'', () => {
            assert.deepStrictEqual(is<keyof { foo: 'bar' }>('foo'), true);
        });

        it('should return false for other strings', () => {
            assert.deepStrictEqual(is<keyof { foo: 'bar' }>(''), false);
            assert.deepStrictEqual(is<keyof { foo: 'bar' }>('bar'), false);
        });

        it('should return false for various other objects', () => {
            assert.deepStrictEqual(is<keyof { foo: 'bar' }>(null), false);
            assert.deepStrictEqual(is<keyof { foo: 'bar' }>(undefined), false);
            assert.deepStrictEqual(is<keyof { foo: 'bar' }>(0), false);
            assert.deepStrictEqual(is<keyof { foo: 'bar' }>(false), false);
            assert.deepStrictEqual(is<keyof { foo: 'bar' }>(Number.NaN), false);
            assert.deepStrictEqual(is<keyof { foo: 'bar' }>({}), false);
            assert.deepStrictEqual(is<keyof { foo: 'bar' }>([]), false);
        });
    });
});
