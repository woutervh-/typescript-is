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

    describe('is<PickKey<{ foo: number }>>', () => {
        interface PickKey<T> {
            key: keyof T;
        }

        it('should return true for objects with key equal to \'foo\'', () => {
            assert.strictEqual(is<PickKey<{ foo: number }>>({ key: 'foo' }), true);
        });

        it('should return false for objects with key not equal to \'foo\'', () => {
            assert.strictEqual(is<PickKey<{ foo: number }>>({ key: '' }), false);
            assert.strictEqual(is<PickKey<{ foo: number }>>({ key: 'bar' }), false);
            assert.strictEqual(is<PickKey<{ foo: number }>>({ key: 'baar' }), false);
            assert.strictEqual(is<PickKey<{ foo: number }>>({ key: 0 }), false);
            assert.strictEqual(is<PickKey<{ foo: number }>>({ key: null }), false);
            assert.strictEqual(is<PickKey<{ foo: number }>>({ key: undefined }), false);
        });

        it('should return false for various other objects', () => {
            assert.strictEqual(is<PickKey<{ foo: number }>>({}), false);
            assert.strictEqual(is<PickKey<{ foo: number }>>([]), false);
            assert.strictEqual(is<PickKey<{ foo: number }>>(null), false);
            assert.strictEqual(is<PickKey<{ foo: number }>>(undefined), false);
            assert.strictEqual(is<PickKey<{ foo: number }>>(true), false);
            assert.strictEqual(is<PickKey<{ foo: number }>>(false), false);
        });
    });

    describe('is<PickKey<{ foo: number, bar: boolean }>>', () => {
        interface PickKey<T> {
            key: keyof T;
        }

        it('should return true for objects with key being one of \'foo\' or \'bar\'', () => {
            assert.strictEqual(is<PickKey<{ foo: number, bar: boolean }>>({ key: 'foo' }), true);
            assert.strictEqual(is<PickKey<{ foo: number, bar: boolean }>>({ key: 'bar' }), true);
        });

        it('should return false for objects with key being neither \'foo\' nor \'bar\'', () => {
            assert.strictEqual(is<PickKey<{ foo: number, bar: boolean }>>({ key: '' }), false);
            assert.strictEqual(is<PickKey<{ foo: number, bar: boolean }>>({ key: 'baar' }), false);
            assert.strictEqual(is<PickKey<{ foo: number, bar: boolean }>>({ key: 0 }), false);
            assert.strictEqual(is<PickKey<{ foo: number, bar: boolean }>>({ key: null }), false);
            assert.strictEqual(is<PickKey<{ foo: number, bar: boolean }>>({ key: undefined }), false);
        });

        it('should return false for various other objects', () => {
            assert.strictEqual(is<PickKey<{ foo: number, bar: boolean }>>({}), false);
            assert.strictEqual(is<PickKey<{ foo: number, bar: boolean }>>([]), false);
            assert.strictEqual(is<PickKey<{ foo: number, bar: boolean }>>(null), false);
            assert.strictEqual(is<PickKey<{ foo: number, bar: boolean }>>(undefined), false);
            assert.strictEqual(is<PickKey<{ foo: number, bar: boolean }>>(true), false);
            assert.strictEqual(is<PickKey<{ foo: number, bar: boolean }>>(false), false);
        });
    });

    describe('is<IndexedPick<{ key: \'value\' }>>', () => {
        interface IndexedPick<T> {
            key: keyof T;
            value: T[keyof T];
        }

        it('should return true for objects with key equal to \'key\' and value equal to \'value\'', () => {
            assert.strictEqual(is<IndexedPick<{ key: 'value' }>>({ key: 'key', value: 'value' }), true);
            assert.strictEqual(is<IndexedPick<{ key: 'value' }>>({ key: 'key', value: 'value', another: 'another' }), true);
        });

        it('should return false for objects with key not equal to \'key\' or value not equal to \'value\'', () => {
            assert.strictEqual(is<IndexedPick<{ key: 'value' }>>({ key: 'key', value: 'key' }), false);
            assert.strictEqual(is<IndexedPick<{ key: 'value' }>>({ key: 'value', value: 'key' }), false);
            assert.strictEqual(is<IndexedPick<{ key: 'value' }>>({ key: 'value', value: 'value' }), false);
        });

        it('should return false for objects without key or value', () => {
            assert.strictEqual(is<IndexedPick<{ key: 'value' }>>({}), false);
            assert.strictEqual(is<IndexedPick<{ key: 'value' }>>({ key: 'key' }), false);
            assert.strictEqual(is<IndexedPick<{ key: 'value' }>>({ value: 'value' }), false);
        });

        it('should return false for other non-objects', () => {
            assert.strictEqual(is<IndexedPick<{ key: 'value' }>>(null), false);
            assert.strictEqual(is<IndexedPick<{ key: 'value' }>>(undefined), false);
            assert.strictEqual(is<IndexedPick<{ key: 'value' }>>([]), false);
            assert.strictEqual(is<IndexedPick<{ key: 'value' }>>(true), false);
            assert.strictEqual(is<IndexedPick<{ key: 'value' }>>(0), false);
            assert.strictEqual(is<IndexedPick<{ key: 'value' }>>('string'), false);
        });
    });

    describe('is<IndexedLiteralPick<{ key: \'value1\' | \'value2\' }>>', () => {
        interface IndexedLiteralPick<T extends { key: any }> {
            key: keyof T;
            value: T['key'];
        }

        it('should return true for objects with key equal to \'key\' and value equal to \'value1\' or \'value2\'', () => {
            assert.strictEqual(is<IndexedLiteralPick<{ key: 'value1' | 'value2' }>>({ key: 'key', value: 'value1' }), true);
            assert.strictEqual(is<IndexedLiteralPick<{ key: 'value1' | 'value2' }>>({ key: 'key', value: 'value2' }), true);
            assert.strictEqual(is<IndexedLiteralPick<{ key: 'value1' | 'value2' }>>({ key: 'key', value: 'value1', another: 'another' }), true);
        });

        it('should return false for objects with key not equal to \'key\' or value not equal to \'value1\' or \'value2\'', () => {
            assert.strictEqual(is<IndexedLiteralPick<{ key: 'value1' | 'value2' }>>({ key: 'value1', value: 'key' }), false);
            assert.strictEqual(is<IndexedLiteralPick<{ key: 'value1' | 'value2' }>>({ key: 'keh', value: 'value1' }), false);
            assert.strictEqual(is<IndexedLiteralPick<{ key: 'value1' | 'value2' }>>({ key: 'key', value: 'value3' }), false);
        });

        it('should return false for objects without key or value', () => {
            assert.strictEqual(is<IndexedLiteralPick<{ key: 'value1' | 'value2' }>>({}), false);
            assert.strictEqual(is<IndexedLiteralPick<{ key: 'value1' | 'value2' }>>({ key: 'key' }), false);
            assert.strictEqual(is<IndexedLiteralPick<{ key: 'value1' | 'value2' }>>({ value: 'value1' }), false);
        });

        it('should return false for other non-objects', () => {
            assert.strictEqual(is<IndexedLiteralPick<{ key: 'value1' | 'value2' }>>(null), false);
            assert.strictEqual(is<IndexedLiteralPick<{ key: 'value1' | 'value2' }>>(undefined), false);
            assert.strictEqual(is<IndexedLiteralPick<{ key: 'value1' | 'value2' }>>([]), false);
            assert.strictEqual(is<IndexedLiteralPick<{ key: 'value1' | 'value2' }>>(true), false);
            assert.strictEqual(is<IndexedLiteralPick<{ key: 'value1' | 'value2' }>>(0), false);
            assert.strictEqual(is<IndexedLiteralPick<{ key: 'value1' | 'value2' }>>('string'), false);
        });
    });

    describe('is<{ foo: number }[\'foo\']>', () => {
        it('should return true for numbers', () => {
            assert.strictEqual(is<{ foo: number }['foo']>(-1), true);
            assert.strictEqual(is<{ foo: number }['foo']>(0), true);
            assert.strictEqual(is<{ foo: number }['foo']>(1), true);
            assert.strictEqual(is<{ foo: number }['foo']>(42), true);
            assert.strictEqual(is<{ foo: number }['foo']>(Number.NaN), true);
            assert.strictEqual(is<{ foo: number }['foo']>(Number.POSITIVE_INFINITY), true);
        });

        it('should return false for non-numbers', () => {
            assert.strictEqual(is<{ foo: number }['foo']>(''), false);
            assert.strictEqual(is<{ foo: number }['foo']>('0'), false);
            assert.strictEqual(is<{ foo: number }['foo']>('1'), false);
            assert.strictEqual(is<{ foo: number }['foo']>(true), false);
            assert.strictEqual(is<{ foo: number }['foo']>(false), false);
            assert.strictEqual(is<{ foo: number }['foo']>(null), false);
            assert.strictEqual(is<{ foo: number }['foo']>(undefined), false);
            assert.strictEqual(is<{ foo: number }['foo']>({}), false);
            assert.strictEqual(is<{ foo: number }['foo']>([]), false);
        });
    });

    describe('is<keyof { foo: \'bar\' }>', () => {
        it('should return true for the string \'foo\'', () => {
            assert.strictEqual(is<keyof { foo: 'bar' }>('foo'), true);
        });

        it('should return false for other strings', () => {
            assert.strictEqual(is<keyof { foo: 'bar' }>(''), false);
            assert.strictEqual(is<keyof { foo: 'bar' }>('bar'), false);
        });

        it('should return false for various other objects', () => {
            assert.strictEqual(is<keyof { foo: 'bar' }>(null), false);
            assert.strictEqual(is<keyof { foo: 'bar' }>(undefined), false);
            assert.strictEqual(is<keyof { foo: 'bar' }>(0), false);
            assert.strictEqual(is<keyof { foo: 'bar' }>(false), false);
            assert.strictEqual(is<keyof { foo: 'bar' }>(Number.NaN), false);
            assert.strictEqual(is<keyof { foo: 'bar' }>({}), false);
            assert.strictEqual(is<keyof { foo: 'bar' }>([]), false);
        });
    });
});
