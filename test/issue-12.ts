import * as assert from 'assert';
import { assertType, is } from '../index';

/* https://github.com/woutervh-/typescript-is/issues/12 */

describe('is', () => {
    interface ConfigInit {
        folder: string;
        children: ConfigInit[];
    }

    describe('is<ConfigInit>', () => {
        it('should return true for valid recursive ConfigInit objects', () => {
            assert.deepStrictEqual(is<ConfigInit>({ folder: '.', children: [] }), true);
            assert.deepStrictEqual(is<ConfigInit>({ folder: '.', children: [{ folder: './foo', children: [] }] }), true);
            assert.deepStrictEqual(is<ConfigInit>({ folder: '.', children: [{ folder: './foo', children: [{ folder: './foo/bar', children: [] }] }] }), true);
            assert.deepStrictEqual(is<ConfigInit>({ folder: '.', children: [{ folder: './foo', children: [] }, { folder: './baz', children: [] }] }), true);
        });

        it('should return false for invalid recursive ConfigInit objects', () => {
            assert.deepStrictEqual(is<ConfigInit>({ folder: '.' }), false);
            assert.deepStrictEqual(is<ConfigInit>({ folder: '.', children: [{ folder: './foo' }] }), false);
            assert.deepStrictEqual(is<ConfigInit>({ folder: '.', children: [{ folder: './foo', children: [{ folder: './foo/bar' }] }] }), false);
            assert.deepStrictEqual(is<ConfigInit>({ folder: '.', children: [{ folder: './foo', children: {} }] }), false);
            assert.deepStrictEqual(is<ConfigInit>({ folder: '.', children: [{ folder: './foo', children: '123' }] }), false);
            assert.deepStrictEqual(is<ConfigInit>({}), false);
            assert.deepStrictEqual(is<ConfigInit>({ folder: '.' }), false);
            assert.deepStrictEqual(is<ConfigInit>({ foolder: '.' }), false);
            assert.deepStrictEqual(is<ConfigInit>({ folder: '.', children: [{ folder: 123, children: [] }] }), false);
            assert.deepStrictEqual(is<ConfigInit>({ folder: '.', children: [{ foolder: './foo', children: [] }] }), false);
            assert.deepStrictEqual(is<ConfigInit>({ folder: '.', children: [{ foolder: 123, children: [] }] }), false);
            assert.deepStrictEqual(is<ConfigInit>({ folder: '.', children: [{ folder: './foo', children: [] }, { folder: './baz', children: {} }] }), false);
        });
    });

    describe('assertType<ConfigInit>', () => {
        it('should throw an error when invalid objects are passed to it', () => {
            const expectedMessageRegExp1 = /validation failed at \$: expected an object, found: .*$/;
            const expectedMessageRegExp2 = /validation failed at \$: expected 'folder' in object, found: .*$/;
            const expectedMessageRegExp3 = /validation failed at \$\.children: expected an array, found: .*$/;
            const expectedMessageRegExp4 = /validation failed at \$\.children\.\[0\]: expected an object, found: .*$/;
            const expectedMessageRegExp5 = /validation failed at \$\.children\.\[0\]: expected 'folder' in object, found: .*$/;
            const expectedMessageRegExp6 = /validation failed at \$\.children\.\[0\]\.children: expected an array, found: .*$/;
            assert.throws(() => assertType<ConfigInit>(null), expectedMessageRegExp1);
            assert.throws(() => assertType<ConfigInit>({}), expectedMessageRegExp2);
            assert.throws(() => assertType<ConfigInit>({ folder: '.', children: 'foo' }), expectedMessageRegExp3);
            assert.throws(() => assertType<ConfigInit>({ folder: '.', children: [null] }), expectedMessageRegExp4);
            assert.throws(() => assertType<ConfigInit>({ folder: '.', children: [{}] }), expectedMessageRegExp5);
            assert.throws(() => assertType<ConfigInit>({ folder: '.', children: [{ folder: './foo', children: null }] }), expectedMessageRegExp6);
        });
    });

    // Note: checking this at runtime would require unbounded recursion.
    interface DirectlyRecursive {
        child: DirectlyRecursive;
    }

    describe('is<DirectlyRecursive>', () => {
        it('should throw for valid objects due maximum call stack size being exceeded', () => {
            const object = {} as DirectlyRecursive;
            object.child = object;
            const expectedMessageRegExp1 = /Maximum call stack size exceeded$/;
            assert.throws(() => is<DirectlyRecursive>(object), expectedMessageRegExp1);
        });

        it('should return false for invalid objects', () => {
            assert.deepStrictEqual(is<DirectlyRecursive>(true), false);
            assert.deepStrictEqual(is<DirectlyRecursive>([]), false);
            assert.deepStrictEqual(is<DirectlyRecursive>({}), false);
            assert.deepStrictEqual(is<DirectlyRecursive>({ child: true }), false);
            assert.deepStrictEqual(is<DirectlyRecursive>({ child: [] }), false);
            assert.deepStrictEqual(is<DirectlyRecursive>({ child: {} }), false);
            assert.deepStrictEqual(is<DirectlyRecursive>({ child: { child: true } }), false);
            assert.deepStrictEqual(is<DirectlyRecursive>({ child: { child: [] } }), false);
            assert.deepStrictEqual(is<DirectlyRecursive>({ child: { child: {} } }), false);
        });
    });

    interface OptionalFieldsRecursive {
        folder?: string;
        children: OptionalFieldsRecursive[];
    }

    describe('is<OptionalFieldsRecursive>', () => {
        it('should return true for valid recursive OptionalFieldsRecursive objects', () => {
            assert.deepStrictEqual(is<OptionalFieldsRecursive>({ children: [] }), true);
        });

        it('should return false for invalid recursive OptionalFieldsRecursive objects', () => {
            assert.deepStrictEqual(is<OptionalFieldsRecursive>({}), false);
        });
    });
});
