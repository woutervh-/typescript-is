import * as assert from 'assert';
import { assertEquals } from '../index';

/* https://github.com/woutervh-/typescript-is/issues/67 */

describe('assertEquals', () => {
    describe('assertEquals<string>', () => {
        it('should throw an error for BigInt types', () => {
            assert.throws(() => assertEquals<string>(BigInt(1)));
        });

        it('should not throw a TypeError for BigInt types', () => {
            try {
                assertEquals<string>(BigInt(1));
            } catch (error) {
                assert.strictEqual(error instanceof TypeError, false);
            }
        });
    });
});
