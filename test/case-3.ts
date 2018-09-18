import * as assert from 'assert';
import { is } from '../index';

describe('is', () => {
    describe('is<number | boolean>', () => {
        it('should return true for numbers', () => {
            assert.strictEqual(is<number | boolean>(0), true);
            assert.strictEqual(is<number | boolean>(1), true);
            assert.strictEqual(is<number | boolean>(-1), true);
            assert.strictEqual(is<number | boolean>(Number.NaN), true);
        });

        it('should return true for booleans', () => {
            assert.strictEqual(is<number | boolean>(true), true);
            assert.strictEqual(is<number | boolean>(false), true);
        });

        it('should return false for strings', () => {
            assert.strictEqual(is<number | boolean>(''), false);
            assert.strictEqual(is<number | boolean>('0'), false);
            assert.strictEqual(is<number | boolean>('1'), false);
            assert.strictEqual(is<number | boolean>('true'), false);
            assert.strictEqual(is<number | boolean>('false'), false);
        });

        it('should return false for various other objects', () => {
            assert.strictEqual(is<number | boolean>(null), false);
            assert.strictEqual(is<number | boolean>(undefined), false);
            assert.strictEqual(is<number | boolean>({}), false);
            assert.strictEqual(is<number | boolean>([]), false);
        });
    });

    describe('is<\'a\' | \'b\' | 0 | 1>', () => {
        it('should return true for string literals \'a\' and \'b\'', () => {
            assert.strictEqual(is<'a' | 'b' | 0 | 1>('a'), true);
            assert.strictEqual(is<'a' | 'b' | 0 | 1>('b'), true);
        });

        it('should return true for numbers 0 and 1', () => {
            assert.strictEqual(is<'a' | 'b' | 0 | 1>(0), true);
            assert.strictEqual(is<'a' | 'b' | 0 | 1>(1), true);
        });

        it('should return false for other strings and numbers', () => {
            assert.strictEqual(is<'a' | 'b' | 0 | 1>('aa'), false);
            assert.strictEqual(is<'a' | 'b' | 0 | 1>('bb'), false);
            assert.strictEqual(is<'a' | 'b' | 0 | 1>(-1), false);
            assert.strictEqual(is<'a' | 'b' | 0 | 1>(2), false);
            assert.strictEqual(is<'a' | 'b' | 0 | 1>(Number.NaN), false);
        });

        it('should return false for various other objects', () => {
            assert.strictEqual(is<'a' | 'b' | 0 | 1>(null), false);
            assert.strictEqual(is<'a' | 'b' | 0 | 1>(undefined), false);
            assert.strictEqual(is<'a' | 'b' | 0 | 1>({}), false);
            assert.strictEqual(is<'a' | 'b' | 0 | 1>([]), false);
        });
    });
});
