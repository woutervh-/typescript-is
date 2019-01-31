import * as assert from 'assert';
import { is } from '../index';

describe('is', () => {
    describe('is<unknown>', () => {
        it('should always return true', () => {
            assert.strictEqual(is<unknown>(0), true);
            assert.strictEqual(is<unknown>(1), true);
            assert.strictEqual(is<unknown>(true), true);
            assert.strictEqual(is<unknown>(false), true);
            assert.strictEqual(is<unknown>(''), true);
            assert.strictEqual(is<unknown>('a'), true);
            assert.strictEqual(is<unknown>({}), true);
            assert.strictEqual(is<unknown>([]), true);
            assert.strictEqual(is<unknown>(null), true);
            assert.strictEqual(is<unknown>(undefined), true);
        });
    });

    describe('is<keyof unknown>', () => {
        it('should always return false', () => {
            assert.strictEqual(is<keyof unknown>(0), false);
            assert.strictEqual(is<keyof unknown>(1), false);
            assert.strictEqual(is<keyof unknown>(true), false);
            assert.strictEqual(is<keyof unknown>(false), false);
            assert.strictEqual(is<keyof unknown>(''), false);
            assert.strictEqual(is<keyof unknown>('a'), false);
            assert.strictEqual(is<keyof unknown>({}), false);
            assert.strictEqual(is<keyof unknown>([]), false);
            assert.strictEqual(is<keyof unknown>(null), false);
            assert.strictEqual(is<keyof unknown>(undefined), false);
        });
    });
});
