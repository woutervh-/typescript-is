import * as assert from 'assert';
import { is } from '../index';

/* https://github.com/woutervh-/typescript-is/issues/6 */

describe('is', () => {
    describe('is<[number, number]>', () => {
        it('should return true for tuples with exactly two numbers', () => {
            assert.deepStrictEqual(is<[number, number]>([0, 0]), true);
            assert.deepStrictEqual(is<[number, number]>([0, 1]), true);
            assert.deepStrictEqual(is<[number, number]>([1, 0]), true);
            assert.deepStrictEqual(is<[number, number]>([1, 1]), true);
            assert.deepStrictEqual(is<[number, number]>([Number.NaN, Number.NEGATIVE_INFINITY]), true);
        });

        it('should return false for arrays of numbers with length unequal to 2', () => {
            assert.deepStrictEqual(is<[number, number]>([]), false);
            assert.deepStrictEqual(is<[number, number]>([0]), false);
            assert.deepStrictEqual(is<[number, number]>([1]), false);
            assert.deepStrictEqual(is<[number, number]>([Number.NaN]), false);
            assert.deepStrictEqual(is<[number, number]>([0, 0, 0]), false);
            assert.deepStrictEqual(is<[number, number]>([1, 1, 1]), false);
            assert.deepStrictEqual(is<[number, number]>([Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY]), false);
        });

        it('should return false for tuples of length 2 with non-numbers', () => {
            assert.deepStrictEqual(is<[number, number]>([0, '1']), false);
            assert.deepStrictEqual(is<[number, number]>([1, '0']), false);
            assert.deepStrictEqual(is<[number, number]>(['1', '0']), false);
            assert.deepStrictEqual(is<[number, number]>([true, false]), false);
            assert.deepStrictEqual(is<[number, number]>([[], {}]), false);
        });
    });

    describe('is<[number, string]>', () => {
        it('should return true for tuples with a number and a string', () => {
            assert.deepStrictEqual(is<[number, string]>([0, '0']), true);
            assert.deepStrictEqual(is<[number, string]>([0, 'true']), true);
            assert.deepStrictEqual(is<[number, string]>([1, '']), true);
            assert.deepStrictEqual(is<[number, string]>([1, 'false']), true);
            assert.deepStrictEqual(is<[number, string]>([Number.NaN, '']), true);
        });

        it('should return false for arrays with length unequal to 2', () => {
            assert.deepStrictEqual(is<[number, string]>([]), false);
            assert.deepStrictEqual(is<[number, string]>([0]), false);
            assert.deepStrictEqual(is<[number, string]>([1]), false);
            assert.deepStrictEqual(is<[number, string]>(['']), false);
            assert.deepStrictEqual(is<[number, string]>(['0']), false);
            assert.deepStrictEqual(is<[number, string]>(['1']), false);
            assert.deepStrictEqual(is<[number, string]>([0, '1', true]), false);
            assert.deepStrictEqual(is<[number, string]>([0, '1', 'false']), false);
            assert.deepStrictEqual(is<[number, string]>([0, '1', 1]), false);
        });

        it('should return false for tuples of length 2 with a non-number at position 0 or a non-string at position 1', () => {
            assert.deepStrictEqual(is<[number, string]>(['0', 1]), false);
            assert.deepStrictEqual(is<[number, string]>(['foo', 'bar']), false);
            assert.deepStrictEqual(is<[number, string]>([1, 1]), false);
            assert.deepStrictEqual(is<[number, string]>([[], {}]), false);
        });
    });

    describe('is<NestedTuple<string>>', () => {
        interface NestedTuple<T> {
            tuple: [T, number];
        }

        it('should return true for objects with a nested tuple with a string and a number', () => {
            assert.deepStrictEqual(is<NestedTuple<string>>({ tuple: ['0', 0] }), true);
            assert.deepStrictEqual(is<NestedTuple<string>>({ tuple: ['true', 0] }), true);
            assert.deepStrictEqual(is<NestedTuple<string>>({ tuple: ['', 1] }), true);
            assert.deepStrictEqual(is<NestedTuple<string>>({ tuple: ['false', 1] }), true);
            assert.deepStrictEqual(is<NestedTuple<string>>({ tuple: ['', Number.NaN] }), true);
        });

        it('should return false objects with a nested array with length unequal to 2', () => {
            assert.deepStrictEqual(is<NestedTuple<string>>({ tuple: [] }), false);
            assert.deepStrictEqual(is<NestedTuple<string>>({ tuple: [0] }), false);
            assert.deepStrictEqual(is<NestedTuple<string>>({ tuple: [1] }), false);
            assert.deepStrictEqual(is<NestedTuple<string>>({ tuple: [''] }), false);
            assert.deepStrictEqual(is<NestedTuple<string>>({ tuple: ['0'] }), false);
            assert.deepStrictEqual(is<NestedTuple<string>>({ tuple: ['1'] }), false);
            assert.deepStrictEqual(is<NestedTuple<string>>({ tuple: ['1', 0, true] }), false);
            assert.deepStrictEqual(is<NestedTuple<string>>({ tuple: ['1', 0, 'false'] }), false);
            assert.deepStrictEqual(is<NestedTuple<string>>({ tuple: ['1', 0, 1] }), false);
        });

        it('should return false for other objects', () => {
            assert.deepStrictEqual(is<NestedTuple<string>>({}), false);
            assert.deepStrictEqual(is<NestedTuple<string>>({ foo: [] }), false);
            assert.deepStrictEqual(is<NestedTuple<string>>({ foo: ['0', 1] }), false);
            assert.deepStrictEqual(is<NestedTuple<string>>([]), false);
            assert.deepStrictEqual(is<NestedTuple<string>>(['true', 0]), false);
        });
    });
});
