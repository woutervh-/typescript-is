import * as assert from 'assert';
import { is } from '../index';

/* https://github.com/woutervh-/typescript-is/issues/35 */

describe('is', () => {
    describe('is<[]>', () => {
        it('should return true for empty tuples', () => {
            assert.deepStrictEqual(is<[]>([]), true);
        });

        it('should return false for non-empty tuples', () => {
            assert.deepStrictEqual(is<[]>([0]), false);
            assert.deepStrictEqual(is<[]>([1]), false);
            assert.deepStrictEqual(is<[]>(['a']), false);
            assert.deepStrictEqual(is<[]>(['a', 'b']), false);
        });

        it('should return false for other non-tuples', () => {
            assert.deepStrictEqual(is<[]>(null), false);
            assert.deepStrictEqual(is<[]>({}), false);
            assert.deepStrictEqual(is<[]>(true), false);
            assert.deepStrictEqual(is<[]>(0), false);
        });
    });
});
