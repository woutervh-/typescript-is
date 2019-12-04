import * as assert from 'assert';
import { createIs } from '../index';

/* https://github.com/woutervh-/typescript-is/issues/43 */

describe('is', () => {
    function foo(_a: number, _b?: string) { return; }
    type FooParams = Parameters<typeof foo>;

    const isFooParams = createIs<FooParams>();

    describe('isFooParams', () => {
        it('should return true for valid parameters, optional or not', () => {
            assert.deepStrictEqual(isFooParams([1, 'a']), true);
            assert.deepStrictEqual(isFooParams([1]), true);
            assert.deepStrictEqual(isFooParams([1, undefined]), true);
        });

        it('should return false for invalid parameters', () => {
            assert.deepStrictEqual(isFooParams([]), false);
            assert.deepStrictEqual(isFooParams([1, null]), false);
        });
    });
});
