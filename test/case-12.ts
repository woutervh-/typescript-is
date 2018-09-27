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
});
