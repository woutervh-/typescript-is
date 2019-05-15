import * as assert from 'assert';
import { is } from '../index';

describe('is', () => {
    describe('is<number | boolean>', () => {
        it('should return true for numbers', () => {
            assert.deepStrictEqual(is<number | boolean>(0), true);
            assert.deepStrictEqual(is<number | boolean>(1), true);
            assert.deepStrictEqual(is<number | boolean>(-1), true);
            assert.deepStrictEqual(is<number | boolean>(Number.NaN), true);
        });

        it('should return true for booleans', () => {
            assert.deepStrictEqual(is<number | boolean>(true), true);
            assert.deepStrictEqual(is<number | boolean>(false), true);
        });

        it('should return false for strings', () => {
            assert.deepStrictEqual(is<number | boolean>(''), false);
            assert.deepStrictEqual(is<number | boolean>('0'), false);
            assert.deepStrictEqual(is<number | boolean>('1'), false);
            assert.deepStrictEqual(is<number | boolean>('true'), false);
            assert.deepStrictEqual(is<number | boolean>('false'), false);
        });

        it('should return false for various other objects', () => {
            assert.deepStrictEqual(is<number | boolean>(null), false);
            assert.deepStrictEqual(is<number | boolean>(undefined), false);
            assert.deepStrictEqual(is<number | boolean>({}), false);
            assert.deepStrictEqual(is<number | boolean>([]), false);
        });
    });

    describe('is<\'a\' | \'b\' | 0 | 1>', () => {
        it('should return true for string literals \'a\' and \'b\'', () => {
            assert.deepStrictEqual(is<'a' | 'b' | 0 | 1>('a'), true);
            assert.deepStrictEqual(is<'a' | 'b' | 0 | 1>('b'), true);
        });

        it('should return true for numbers 0 and 1', () => {
            assert.deepStrictEqual(is<'a' | 'b' | 0 | 1>(0), true);
            assert.deepStrictEqual(is<'a' | 'b' | 0 | 1>(1), true);
        });

        it('should return false for other strings and numbers', () => {
            assert.deepStrictEqual(is<'a' | 'b' | 0 | 1>('aa'), false);
            assert.deepStrictEqual(is<'a' | 'b' | 0 | 1>('bb'), false);
            assert.deepStrictEqual(is<'a' | 'b' | 0 | 1>(-1), false);
            assert.deepStrictEqual(is<'a' | 'b' | 0 | 1>(2), false);
            assert.deepStrictEqual(is<'a' | 'b' | 0 | 1>(Number.NaN), false);
        });

        it('should return false for various other objects', () => {
            assert.deepStrictEqual(is<'a' | 'b' | 0 | 1>(null), false);
            assert.deepStrictEqual(is<'a' | 'b' | 0 | 1>(undefined), false);
            assert.deepStrictEqual(is<'a' | 'b' | 0 | 1>({}), false);
            assert.deepStrictEqual(is<'a' | 'b' | 0 | 1>([]), false);
        });
    });
});
