import { assertType } from '../index';

/* https://github.com/woutervh-/typescript-is/issues/73 */

describe('assertType', () => {
    describe('assertType<string | null>', () => {
        it('should not throw an error for null', () => {
            assertType<string | null>(null)
        });
    });
});
