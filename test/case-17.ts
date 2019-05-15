import * as assert from 'assert';
import { is } from '../index';

describe('is', () => {
    describe('is<unknown>', () => {
        it('should always return true', () => {
            assert.deepStrictEqual(is<unknown>(0), true);
            assert.deepStrictEqual(is<unknown>(1), true);
            assert.deepStrictEqual(is<unknown>(true), true);
            assert.deepStrictEqual(is<unknown>(false), true);
            assert.deepStrictEqual(is<unknown>(''), true);
            assert.deepStrictEqual(is<unknown>('a'), true);
            assert.deepStrictEqual(is<unknown>({}), true);
            assert.deepStrictEqual(is<unknown>([]), true);
            assert.deepStrictEqual(is<unknown>(null), true);
            assert.deepStrictEqual(is<unknown>(undefined), true);
        });
    });

    describe('is<keyof unknown>', () => {
        it('should always return false', () => {
            assert.deepStrictEqual(is<keyof unknown>(0), false);
            assert.deepStrictEqual(is<keyof unknown>(1), false);
            assert.deepStrictEqual(is<keyof unknown>(true), false);
            assert.deepStrictEqual(is<keyof unknown>(false), false);
            assert.deepStrictEqual(is<keyof unknown>(''), false);
            assert.deepStrictEqual(is<keyof unknown>('a'), false);
            assert.deepStrictEqual(is<keyof unknown>({}), false);
            assert.deepStrictEqual(is<keyof unknown>([]), false);
            assert.deepStrictEqual(is<keyof unknown>(null), false);
            assert.deepStrictEqual(is<keyof unknown>(undefined), false);
        });
    });
});
