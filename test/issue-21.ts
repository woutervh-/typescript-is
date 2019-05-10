import { assertType } from '../index';

/* https://github.com/woutervh-/typescript-is/issues/21 */

// To properly test this issue, set disallowSuperfluousObjectProperties to `true` in the configuration.
// Then inspect the generated code to see if the keys of the object are checked properly.

describe('assertType', () => {
    describe('assertType<{ key: number }>', () => {
        it('should pass with valid objects', () => {
            assertType<{ key: number }>({ key: 0 });
        });
    });

    describe('assertType<UsernamePassword>', () => {
        interface HasPassword {
            password: string;
        }

        interface HasUsername {
            username: string;
        }

        type UsernamePassword = HasPassword & HasUsername;

        const object = { username: 'test', password: 'test' };

        it('should pass with valid objects', () => {
            assertType<UsernamePassword>(object);
        });
    });
});
