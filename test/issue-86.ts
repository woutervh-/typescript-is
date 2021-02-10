import * as assert from 'assert';
import { is } from '../index';

/* https://github.com/woutervh-/typescript-is/issues/86 */

type Y<T> = {
    field: T;
}

interface X extends Y<string> {
}

describe('is', () => {
    describe('Interface extending a parameterised type alias', () => {
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
