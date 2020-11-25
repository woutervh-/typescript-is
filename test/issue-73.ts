import { assertType } from '../index';

/* https://github.com/woutervh-/typescript-is/issues/73 */

// Note: this test case is most useful when testing in combiation with "strictNullChecks: true | false"

describe('assertType', () => {
    describe('assertType<string | null>', () => {
        it('should not throw an error for null', () => {
            assertType<string | null>(null)
        });
    });
});
