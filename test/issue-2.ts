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
            const expectedMessageRegExp = /validation failed at \$: expected an object, found: .*$/;
            assert.throws(() => assertType<{ foo: string }>(0), expectedMessageRegExp);
            assert.throws(() => assertType<{ foo: string }>([]), expectedMessageRegExp);
            assert.throws(() => assertType<{ foo: string }>(null), expectedMessageRegExp);
            assert.throws(() => assertType<{ foo: string }>(true), expectedMessageRegExp);
        });

        it('should throw an error if objects without foo are passed to it', () => {
            const expectedMessageRegExp = /validation failed at \$: expected 'foo' in object, found: .*$/;
            assert.throws(() => assertType<{ foo: string }>({}), expectedMessageRegExp);
            assert.throws(() => assertType<{ foo: string }>({ bar: 'baz' }), expectedMessageRegExp);
        });

        it('should throw an error if objects with foo not a string are passed to it', () => {
            const expectedMessageRegExp = /validation failed at \$\.foo: expected a string, found: .*$/;
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
            const expectedMessageRegExp = /validation failed at \$: expected 'foo' in object, found: .*$/;
            assert.throws(() => assertType<{ foo: string }>({}), expectedMessageRegExp);
            assert.throws(() => assertType<{ foo: string }>({ bar: 'baz' }), expectedMessageRegExp);
        });

        it('should throw an error if invalid objects are passed to it', () => {
            const expectedMessageRegExp = /validation failed at \$: expected an object, found: .*$/;
            assert.throws(() => assertType<{ foo: number[] }>(0), expectedMessageRegExp);
            assert.throws(() => assertType<{ foo: number[] }>(null), expectedMessageRegExp);
            assert.throws(() => assertType<{ foo: number[] }>(true), expectedMessageRegExp);
        });

        it('should throw an error if objects where foo is not an array of numbers are passed to it', () => {
            const expectedMessageRegExp1 = /validation failed at \$\.foo\.\[1\]: expected a number, found: .*$/;
            const expectedMessageRegExp2 = /validation failed at \$\.foo\.\[0\]: expected a number, found: .*$/;
            assert.throws(() => assertType<{ foo: number[] }>({ foo: [0, '0'] }), expectedMessageRegExp1);
            assert.throws(() => assertType<{ foo: number[] }>({ foo: ['1'] }), expectedMessageRegExp2);
            assert.throws(() => assertType<{ foo: number[] }>({ foo: [{}] }), expectedMessageRegExp2);
            assert.throws(() => assertType<{ foo: number[] }>({ foo: [[]] }), expectedMessageRegExp2);
            assert.throws(() => assertType<{ foo: number[] }>({ foo: [null] }), expectedMessageRegExp2);
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
            const expectedMessageRegExp = /validation failed at \$\.nested\.foo: there are no valid alternatives, found: .*$/;
            assert.throws(() => assertType<{ nested: Nested }>({ nested: { foo: 'qux' } }), expectedMessageRegExp);
            assert.throws(() => assertType<{ nested: Nested }>({ nested: { foo: 0 } }), expectedMessageRegExp);
            assert.throws(() => assertType<{ nested: Nested }>({ nested: { foo: [] } }), expectedMessageRegExp);
            assert.throws(() => assertType<{ nested: Nested }>({ nested: { foo: {} } }), expectedMessageRegExp);
        });

        it('should throw an error if nested objects without foo are passed to it', () => {
            const expectedMessageRegExp = /validation failed at \$\.nested: expected 'foo' in object, found: .*$/;
            assert.throws(() => assertType<{ nested: Nested }>({ nested: {} }), expectedMessageRegExp);
            assert.throws(() => assertType<{ nested: Nested }>({ nested: { foh: 'bar' } }), expectedMessageRegExp);
        });

        it('should throw an error if nested properties that are not objects are passed to it', () => {
            const expectedMessageRegExp = /validation failed at \$\.nested: expected an object, found: .*$/;
            assert.throws(() => assertType<{ nested: Nested }>({ nested: 0 }), expectedMessageRegExp);
            assert.throws(() => assertType<{ nested: Nested }>({ nested: true }), expectedMessageRegExp);
            assert.throws(() => assertType<{ nested: Nested }>({ nested: null }), expectedMessageRegExp);
            assert.throws(() => assertType<{ nested: Nested }>({ nested: [] }), expectedMessageRegExp);
        });

        it('should throw an error if objects without nested are passed to it', () => {
            const expectedMessageRegExp = /validation failed at \$: expected 'nested' in object, found: .*$/;
            assert.throws(() => assertType<{ nested: Nested }>({ nisted: { foo: 'bar' } }), expectedMessageRegExp);
            assert.throws(() => assertType<{ nested: Nested }>({ nisted: { foh: 'baz' } }), expectedMessageRegExp);
        });

        it('should throw an error if other objects are passed to it', () => {
            const expectedMessageRegExp = /validation failed at \$: expected an object, found: .*$/;
            assert.throws(() => assertType<{ nested: Nested }>('0'), expectedMessageRegExp);
            assert.throws(() => assertType<{ nested: Nested }>(1), expectedMessageRegExp);
            assert.throws(() => assertType<{ nested: Nested }>([]), expectedMessageRegExp);
            assert.throws(() => assertType<{ nested: Nested }>(null), expectedMessageRegExp);
            assert.throws(() => assertType<{ nested: Nested }>(false), expectedMessageRegExp);
        });
    });

    describe('assertType<{ [Key: string]: boolean }>', () => {
        it('should return valid objects that are passed to it', () => {
            assert.deepStrictEqual(assertType<{ [Key: string]: boolean }>({}), {});
            assert.deepStrictEqual(assertType<{ [Key: string]: boolean }>({ foo: true }), { foo: true });
            assert.deepStrictEqual(assertType<{ [Key: string]: boolean }>({ bar: false }), { bar: false });
        });

        it('should throw an error if objects with non-boolen values are passed to it', () => {
            const expectedMessageRegExp1 = /validation failed at \$\.foo: expected a boolean, found: .*$/;
            const expectedMessageRegExp2 = /validation failed at \$\.bar: expected a boolean, found: .*$/;
            assert.throws(() => assertType<{ [Key: string]: boolean }>({ foo: 0 }), expectedMessageRegExp1);
            assert.throws(() => assertType<{ [Key: string]: boolean }>({ bar: 'foo' }), expectedMessageRegExp2);
            assert.throws(() => assertType<{ [Key: string]: boolean }>({ bar: [] }), expectedMessageRegExp2);
            assert.throws(() => assertType<{ [Key: string]: boolean }>({ bar: null }), expectedMessageRegExp2);
        });
    });
});
