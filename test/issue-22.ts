import * as assert from 'assert';
import { assertEquals, createAssertEquals, createEquals, equals } from '../index';

/* https://github.com/woutervh-/typescript-is/issues/22 */

describe('equals', () => {
    describe('equals<{ foo: number }>', () => {
        it('should return true for objects with `foo` being a number', () => {
            assert.deepStrictEqual(equals<{ foo: number }>({ foo: 0 }), true);
            assert.deepStrictEqual(equals<{ foo: number }>({ foo: 1 }), true);
            assert.deepStrictEqual(equals<{ foo: number }>({ foo: Number.NaN }), true);
        });

        it('should return false for objects without `foo` being a number', () => {
            assert.deepStrictEqual(equals<{ foo: number }>(null), false);
            assert.deepStrictEqual(equals<{ foo: number }>({}), false);
            assert.deepStrictEqual(equals<{ foo: number }>({ foo: 'value' }), false);
        });

        it('should return false for objects with `foo` being a number and with other properties', () => {
            assert.deepStrictEqual(equals<{ foo: number }>({ foo: 0, bar: 1 }), false);
            assert.deepStrictEqual(equals<{ foo: number }>({ foo: 0, bar: 'value' }), false);
            assert.deepStrictEqual(equals<{ foo: number }>({ foo: 0, baz: 'foo' }), false);
        });
    });
});

describe('createEquals', () => {
    describe('createEquals<{ foo: number }>', () => {
        const equalsObject = createEquals<{ foo: number }>();

        it('should return a function', () => {
            assert.deepStrictEqual(typeof equalsObject, 'function');
        });

        it('should return true for objects with `foo` being a number', () => {
            assert.deepStrictEqual(equalsObject({ foo: 0 }), true);
            assert.deepStrictEqual(equalsObject({ foo: 1 }), true);
            assert.deepStrictEqual(equalsObject({ foo: Number.NaN }), true);
        });

        it('should return false for objects without `foo` being a number', () => {
            assert.deepStrictEqual(equalsObject(null), false);
            assert.deepStrictEqual(equalsObject({}), false);
            assert.deepStrictEqual(equalsObject({ foo: 'value' }), false);
        });

        it('should return false for objects with `foo` being a number and with other properties', () => {
            assert.deepStrictEqual(equalsObject({ foo: 0, bar: 1 }), false);
            assert.deepStrictEqual(equalsObject({ foo: 0, bar: 'value' }), false);
            assert.deepStrictEqual(equalsObject({ foo: 0, baz: 'foo' }), false);
        });
    });
});

describe('assertEquals', () => {
    describe('assertEquals<{ foo: number }>', () => {
        it('should return the objects passed to it', () => {
            assert.deepStrictEqual(assertEquals<{ foo: number }>({ foo: 0 }), { foo: 0 });
            assert.deepStrictEqual(assertEquals<{ foo: number }>({ foo: 1 }), { foo: 1 });
        });

        it('should throw an error if objects without `foo` being a number are passed to it', () => {
            const expectedMessageRegExp = /validation failed at \$: expected 'foo' in object, found: .*$/;
            assert.throws(() => assertEquals<{ foo: number }>({}), expectedMessageRegExp);
            assert.throws(() => assertEquals<{ foo: number }>({ bar: 0 }), expectedMessageRegExp);
        });

        it('should throw an error if objects with `foo` being a number and with other properties are passed to it', () => {
            const expectedMessageRegExp = /validation failed at \$: superfluous property 'bar' in object, found: .*$/;
            assert.throws(() => assertEquals<{ foo: number }>({ foo: 0, bar: 1 }), expectedMessageRegExp);
            assert.throws(() => assertEquals<{ foo: number }>({ foo: 0, bar: 'value' }), expectedMessageRegExp);
        });
    });
});

describe('createAssertEquals', () => {
    describe('createAssertEquals<{ foo: number }>', () => {
        const assertObject = createAssertEquals<{ foo: number }>();

        it('should return a function', () => {
            assert.deepStrictEqual(typeof assertObject, 'function');
        });

        it('should return the objects passed to it', () => {
            assert.deepStrictEqual(assertObject({ foo: 0 }), { foo: 0 });
            assert.deepStrictEqual(assertObject({ foo: 1 }), { foo: 1 });
        });

        it('should throw an error if objects without `foo` being a number are passed to it', () => {
            const expectedMessageRegExp = /validation failed at \$: expected 'foo' in object, found: .*$/;
            assert.throws(() => assertObject({}), expectedMessageRegExp);
            assert.throws(() => assertObject({ bar: 0 }), expectedMessageRegExp);
        });

        it('should throw an error if objects with `foo` being a number and with other properties are passed to it', () => {
            const expectedMessageRegExp = /validation failed at \$: superfluous property 'bar' in object, found: .*$/;
            assert.throws(() => assertObject({ foo: 0, bar: 1 }), expectedMessageRegExp);
            assert.throws(() => assertObject({ foo: 0, bar: 'value' }), expectedMessageRegExp);
        });
    });
});
