import * as assert from 'assert';
import { assertType } from '../index';

/* https://github.com/woutervh-/typescript-is/issues/2 */

describe('assertType', () => {
    describe('assertType<{ foo: string }>', () => {
        it('should return valid objects that are passed to it', () => {
            assert.deepStrictEqual(assertType<{ foo: string }>({ foo: '' }), { foo: '' });
            assert.deepStrictEqual(assertType<{ foo: string }>({ foo: '0' }), { foo: '0' });
            assert.deepStrictEqual(assertType<{ foo: string }>({ foo: 'a' }), { foo: 'a' });
            assert.deepStrictEqual(assertType<{ foo: string }>({ foo: 'true' }), { foo: 'true' });
        });

        it('should throw an error if invalid objects are passed to it', () => {
            const expectedMessageRegExp = /at \$; cause: at \$: expected object$/;
            assert.throws(() => assertType<{ foo: string }>(0), expectedMessageRegExp);
            assert.throws(() => assertType<{ foo: string }>([]), expectedMessageRegExp);
            assert.throws(() => assertType<{ foo: string }>(null), expectedMessageRegExp);
            assert.throws(() => assertType<{ foo: string }>(true), expectedMessageRegExp);
        });

        it('should throw an error if objects without foo are passed to it', () => {
            const expectedMessageRegExp = /at \$; cause: at \$; cause: at \$: expected 'foo' in object$/;
            assert.throws(() => assertType<{ foo: string }>({}), expectedMessageRegExp);
            assert.throws(() => assertType<{ foo: string }>({ bar: 'baz' }), expectedMessageRegExp);
        });

        it('should throw an error if objects with foo not a string are passed to it', () => {
            const expectedMessageRegExp = /at \$; cause: at \$; cause: at \$\.foo: expected string$/;
            assert.throws(() => assertType<{ foo: string }>({ foo: 0 }), expectedMessageRegExp);
            assert.throws(() => assertType<{ foo: string }>({ foo: false }), expectedMessageRegExp);
        });
    });

    describe('assertType<{ foo: number[] }>', () => {
        it('should return valid objects that are passed to it', () => {
            assert.deepStrictEqual(assertType<{ foo: number[] }>({ foo: [] }), { foo: [] });
            assert.deepStrictEqual(assertType<{ foo: number[] }>({ foo: [0] }), { foo: [0] });
            assert.deepStrictEqual(assertType<{ foo: number[] }>({ foo: [0, 1] }), { foo: [0, 1] });
            assert.deepStrictEqual(assertType<{ foo: number[] }>({ foo: [Number.NEGATIVE_INFINITY] }), { foo: [Number.NEGATIVE_INFINITY] });
            // assert.deepStrictEqual(assertType<{ foo: number[] }>({ foo: [Number.NaN] }), { foo: [Number.NaN] }); // NodeJS 6, 7 and 8 fail on NaN comparison
        });

        it('should throw an error if objects without foo are passed to it', () => {
            const expectedMessageRegExp = /at \$; cause: at \$; cause: at \$: expected 'foo' in object$/;
            assert.throws(() => assertType<{ foo: string }>({}), expectedMessageRegExp);
            assert.throws(() => assertType<{ foo: string }>({ bar: 'baz' }), expectedMessageRegExp);
        });

        it('should throw an error if invalid objects are passed to it', () => {
            const expectedMessageRegExp = /at \$; cause: at \$: expected object$/;
            assert.throws(() => assertType<{ foo: number[] }>(0), expectedMessageRegExp);
            assert.throws(() => assertType<{ foo: number[] }>(null), expectedMessageRegExp);
            assert.throws(() => assertType<{ foo: number[] }>(true), expectedMessageRegExp);
        });

        it('should throw an error if objects where foo is not an array of numbers are passed to it', () => {
            const expectedMessageRegExp = /at \$; cause: at \$; cause: at \$\.foo; cause: at \$\.foo\.\[\]: expected number$/;
            assert.throws(() => assertType<{ foo: number[] }>({ foo: [0, '0'] }), expectedMessageRegExp);
            assert.throws(() => assertType<{ foo: number[] }>({ foo: ['1'] }), expectedMessageRegExp);
            assert.throws(() => assertType<{ foo: number[] }>({ foo: [{}] }), expectedMessageRegExp);
            assert.throws(() => assertType<{ foo: number[] }>({ foo: [[]] }), expectedMessageRegExp);
            assert.throws(() => assertType<{ foo: number[] }>({ foo: [null] }), expectedMessageRegExp);
        });
    });

    describe('assertType<{ nested: Nested }>', () => {
        interface Nested {
            foo: 'bar' | 'baz';
        }

        it('should return valid objects that are passed to it', () => {
            assert.deepStrictEqual(assertType<{ nested: Nested }>({ nested: { foo: 'bar' } }), { nested: { foo: 'bar' } });
            assert.deepStrictEqual(assertType<{ nested: Nested }>({ nested: { foo: 'baz' } }), { nested: { foo: 'baz' } });
        });

        it('should throw an error if nested objects with foo not \'bar\' or \'baz\' are passed to it', () => {
            const expectedMessageRegExp = /at \$; cause: at \$; cause: at \$\.nested; cause: at \$\.nested; cause: at \$\.nested\.foo; all causes: \(at \$\.nested\.foo: expected string 'bar'; at \$\.nested\.foo: expected string 'baz'\)$/;
            assert.throws(() => assertType<{ nested: Nested }>({ nested: { foo: 'qux' } }), expectedMessageRegExp);
            assert.throws(() => assertType<{ nested: Nested }>({ nested: { foo: 0 } }), expectedMessageRegExp);
            assert.throws(() => assertType<{ nested: Nested }>({ nested: { foo: [] } }), expectedMessageRegExp);
            assert.throws(() => assertType<{ nested: Nested }>({ nested: { foo: {} } }), expectedMessageRegExp);
        });

        it('should throw an error if nested objects without foo are passed to it', () => {
            const expectedMessageRegExp = /at \$; cause: at \$; cause: at \$\.nested; cause: at \$\.nested; cause: at \$\.nested: expected 'foo' in object$/;
            assert.throws(() => assertType<{ nested: Nested }>({ nested: {} }), expectedMessageRegExp);
            assert.throws(() => assertType<{ nested: Nested }>({ nested: { foh: 'bar' } }), expectedMessageRegExp);
        });

        it('should throw an error if nested properties that are not objects are passed to it', () => {
            const expectedMessageRegExp = /at \$; cause: at \$; cause: at \$\.nested; cause: at \$\.nested: expected object$/;
            assert.throws(() => assertType<{ nested: Nested }>({ nested: 0 }), expectedMessageRegExp);
            assert.throws(() => assertType<{ nested: Nested }>({ nested: true }), expectedMessageRegExp);
            assert.throws(() => assertType<{ nested: Nested }>({ nested: null }), expectedMessageRegExp);
            assert.throws(() => assertType<{ nested: Nested }>({ nested: [] }), expectedMessageRegExp);
        });

        it('should throw an error if objects without nested are passed to it', () => {
            const expectedMessageRegExp = /at \$; cause: at \$; cause: at \$: expected 'nested' in object$/;
            assert.throws(() => assertType<{ nested: Nested }>({ nisted: { foo: 'bar' } }), expectedMessageRegExp);
            assert.throws(() => assertType<{ nested: Nested }>({ nisted: { foh: 'baz' } }), expectedMessageRegExp);
        });

        it('should throw an error if other objects are passed to it', () => {
            const expectedMessageRegExp = /at \$; cause: at \$: expected object$/;
            assert.throws(() => assertType<{ nested: Nested }>('0'), expectedMessageRegExp);
            assert.throws(() => assertType<{ nested: Nested }>(1), expectedMessageRegExp);
            assert.throws(() => assertType<{ nested: Nested }>([]), expectedMessageRegExp);
            assert.throws(() => assertType<{ nested: Nested }>(null), expectedMessageRegExp);
            assert.throws(() => assertType<{ nested: Nested }>(false), expectedMessageRegExp);
        });
    });
});
