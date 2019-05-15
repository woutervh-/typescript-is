import * as assert from 'assert';
import { is } from '../index';

describe('is', () => {
    describe('is<number[]>', () => {
        it('should return true for arrays of numbers', () => {
            assert.deepStrictEqual(is<number[]>([]), true);
            assert.deepStrictEqual(is<number[]>([0]), true);
            assert.deepStrictEqual(is<number[]>([1]), true);
            assert.deepStrictEqual(is<number[]>([Number.NaN]), true);
            assert.deepStrictEqual(is<number[]>([-1, 0, 1]), true);
        });

        it('should return false for non-arrays', () => {
            assert.deepStrictEqual(is<number[]>(true), false);
            assert.deepStrictEqual(is<number[]>(false), false);
            assert.deepStrictEqual(is<number[]>(0), false);
            assert.deepStrictEqual(is<number[]>(1), false);
            assert.deepStrictEqual(is<number[]>(''), false);
            assert.deepStrictEqual(is<number[]>('a'), false);
            assert.deepStrictEqual(is<number[]>(null), false);
            assert.deepStrictEqual(is<number[]>(undefined), false);
            assert.deepStrictEqual(is<number[]>({}), false);
        });

        it('should return false for arrays of non-numbers', () => {
            assert.deepStrictEqual(is<number[]>([true]), false);
            assert.deepStrictEqual(is<number[]>([false]), false);
            assert.deepStrictEqual(is<number[]>(['']), false);
            assert.deepStrictEqual(is<number[]>(['a']), false);
            assert.deepStrictEqual(is<number[]>([null]), false);
            assert.deepStrictEqual(is<number[]>([undefined]), false);
            assert.deepStrictEqual(is<number[]>([{}]), false);
            assert.deepStrictEqual(is<number[]>([[]]), false);
            assert.deepStrictEqual(is<number[]>([[0]]), false);
            assert.deepStrictEqual(is<number[]>([[1]]), false);
        });

        it('should return false for arrays of mixed numbers and non-numbers', () => {
            assert.deepStrictEqual(is<number[]>([0, true]), false);
            assert.deepStrictEqual(is<number[]>([1, false]), false);
            assert.deepStrictEqual(is<number[]>([2, '']), false);
            assert.deepStrictEqual(is<number[]>([3, '3']), false);
            assert.deepStrictEqual(is<number[]>([4, {}]), false);
            assert.deepStrictEqual(is<number[]>([5, []]), false);
            assert.deepStrictEqual(is<number[]>([6, [7]]), false);
            assert.deepStrictEqual(is<number[]>([8, null]), false);
            assert.deepStrictEqual(is<number[]>([Number.NaN, undefined]), false);
        });
    });

    describe('is<number[][]>', () => {
        it('should return true for arrays of arrays of numbers', () => {
            assert.deepStrictEqual(is<number[][]>([]), true);
            assert.deepStrictEqual(is<number[][]>([[]]), true);
            assert.deepStrictEqual(is<number[][]>([[], []]), true);
            assert.deepStrictEqual(is<number[][]>([[0], []]), true);
            assert.deepStrictEqual(is<number[][]>([[0], [1, 2]]), true);
        });

        it('should return false for non-arrays', () => {
            assert.deepStrictEqual(is<number[][]>(true), false);
            assert.deepStrictEqual(is<number[][]>(false), false);
            assert.deepStrictEqual(is<number[][]>(0), false);
            assert.deepStrictEqual(is<number[][]>(1), false);
            assert.deepStrictEqual(is<number[][]>(''), false);
            assert.deepStrictEqual(is<number[][]>('a'), false);
            assert.deepStrictEqual(is<number[][]>(null), false);
            assert.deepStrictEqual(is<number[][]>(undefined), false);
            assert.deepStrictEqual(is<number[][]>({}), false);
        });

        it('should return false for arrays of non-arrays-of-numbers', () => {
            assert.deepStrictEqual(is<number[][]>([true]), false);
            assert.deepStrictEqual(is<number[][]>([false]), false);
            assert.deepStrictEqual(is<number[][]>(['']), false);
            assert.deepStrictEqual(is<number[][]>(['a']), false);
            assert.deepStrictEqual(is<number[][]>([null]), false);
            assert.deepStrictEqual(is<number[][]>([undefined]), false);
            assert.deepStrictEqual(is<number[][]>([{}]), false);
            assert.deepStrictEqual(is<number[][]>([[true]]), false);
            assert.deepStrictEqual(is<number[][]>([[false]]), false);
            assert.deepStrictEqual(is<number[][]>([['']]), false);
            assert.deepStrictEqual(is<number[][]>([['a']]), false);
            assert.deepStrictEqual(is<number[][]>([[null]]), false);
            assert.deepStrictEqual(is<number[][]>([[undefined]]), false);
            assert.deepStrictEqual(is<number[][]>([[{}]]), false);
            assert.deepStrictEqual(is<number[][]>([[[]]]), false);
        });

        it('should return false for various mixes of arrays of arrays of numbers and non-arrays and non-arrays-of-numbers', () => {
            assert.deepStrictEqual(is<number[][]>([[0], ['a']]), false);
            assert.deepStrictEqual(is<number[][]>([['a'], [0]]), false);
            assert.deepStrictEqual(is<number[][]>([[0, 1], [0, true]]), false);
            assert.deepStrictEqual(is<number[][]>([[0, 1], [0, false]]), false);
            assert.deepStrictEqual(is<number[][]>([[0, 1], [0, []]]), false);
        });
    });

    describe('is<NestedArrayOf<boolean>>', () => {
        interface NestedArrayOf<T> {
            nested: T[];
        }

        it('should return true for nested arrays of booleans', () => {
            assert.deepStrictEqual(is<NestedArrayOf<boolean>>({ nested: [] }), true);
            assert.deepStrictEqual(is<NestedArrayOf<boolean>>({ nested: [true] }), true);
            assert.deepStrictEqual(is<NestedArrayOf<boolean>>({ nested: [false] }), true);
        });

        it('should return false for nested arrays of non-booleans', () => {
            assert.deepStrictEqual(is<NestedArrayOf<boolean>>({ nested: [0] }), false);
            assert.deepStrictEqual(is<NestedArrayOf<boolean>>({ nested: [1] }), false);
            assert.deepStrictEqual(is<NestedArrayOf<boolean>>({ nested: [''] }), false);
            assert.deepStrictEqual(is<NestedArrayOf<boolean>>({ nested: [null] }), false);
            assert.deepStrictEqual(is<NestedArrayOf<boolean>>({ nested: [undefined] }), false);
            assert.deepStrictEqual(is<NestedArrayOf<boolean>>({ nested: [{}] }), false);
            assert.deepStrictEqual(is<NestedArrayOf<boolean>>({ nested: [[]] }), false);
        });

        it('should return false for various other objects', () => {
            assert.deepStrictEqual(is<NestedArrayOf<boolean>>(true), false);
            assert.deepStrictEqual(is<NestedArrayOf<boolean>>(false), false);
            assert.deepStrictEqual(is<NestedArrayOf<boolean>>(0), false);
            assert.deepStrictEqual(is<NestedArrayOf<boolean>>(1), false);
            assert.deepStrictEqual(is<NestedArrayOf<boolean>>({}), false);
            assert.deepStrictEqual(is<NestedArrayOf<boolean>>([]), false);
            assert.deepStrictEqual(is<NestedArrayOf<boolean>>({ nested: true }), false);
            assert.deepStrictEqual(is<NestedArrayOf<boolean>>({ nested: false }), false);
            assert.deepStrictEqual(is<NestedArrayOf<boolean>>({ nested: 0 }), false);
            assert.deepStrictEqual(is<NestedArrayOf<boolean>>({ nested: null }), false);
            assert.deepStrictEqual(is<NestedArrayOf<boolean>>({ nested: undefined }), false);
        });
    });
});
