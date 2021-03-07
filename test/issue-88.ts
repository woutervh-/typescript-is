import * as assert from 'assert';
import { is } from '../index';

/* https://github.com/woutervh-/typescript-is/issues/88 */

interface Z<T> {
    field: T;
}

type Y<T> = Z<T>

type X = Y<string>

describe('is', () => {
    describe('Parameterised type alias of a parameterised type alias of an interface', () => {
        it('should return true for object with field type string', () => {
            assert.deepStrictEqual(is<X>({ field: 'some-string' }), true);
        });
        it('should return false for object with field type number', () => {
            assert.deepStrictEqual(is<X>({ field: 0 }), false);
        });
        it('should return false for object without field', () => {
            assert.deepStrictEqual(is<X>({}), false);
        });
    });
});
