import * as assert from 'assert';
import { assertEquals } from '../index';

/* https://github.com/woutervh-/typescript-is/issues/111 */

    // To properly test this issue, set disallowSuperfluousObjectProperties to `true` in the configuration.
    // Then inspect the generated code to see if the keys of the object are checked properly.

describe('assertEquals', () => {
    describe('assertEquals<BarIntersection>', () => {
        type Foo = {
            quux: string;
        };

        type BarIntersection = {
            foo: Foo;
        } & {
            bar: string;
        };

        type BarNotIntersection = {
            foo: Foo;
            bar: string;
        };

        const document = {
            bar: 'bar',
            foo: {
                quux: 'quux',
                super: 'fluous'
            }
        };

        it('should throw with invalid objects', () => {
            assert.throws(() => assertEquals<Foo>(document.foo));
            assert.throws(() => assertEquals<BarNotIntersection>(document));
            assert.throws(() => assertEquals<BarIntersection>(document));
        });
    });
});
