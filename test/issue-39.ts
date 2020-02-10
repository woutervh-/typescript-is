import * as assert from 'assert';
import { assertType, TypeGuardError } from '../index';

describe('assertType', () => {
    interface Bar {
        values: string[];
        index: number;
    }

    interface Foo {
        foo: string;
        bar: Bar;
    }

    describe('assertType<Foo>', () => {
        it('should not throw an error for valid objects', () => {
            assertType<Foo>({ foo: 'foo', bar: { values: ['bar'], index: 0 } });
        });

        it('should throw an error with the type of and path to the error', () => {
            try {
                assertType<Foo>(null);
            } catch (error) {
                assert.deepStrictEqual(error instanceof TypeGuardError, true);
                assert.deepStrictEqual(error.path, ['$']);
                assert.deepStrictEqual(error.reason, { type: 'object' });
            }

            try {
                assertType<Foo>({});
            } catch (error) {
                assert.deepStrictEqual(error instanceof TypeGuardError, true);
                assert.deepStrictEqual(error.path, ['$']);
                assert.deepStrictEqual(error.reason, { type: 'missing-property', property: 'foo' });
            }

            try {
                assertType<Foo>({ foo: 123 });
            } catch (error) {
                assert.deepStrictEqual(error instanceof TypeGuardError, true);
                assert.deepStrictEqual(error.path, ['$', 'foo']);
                assert.deepStrictEqual(error.reason, { type: 'string' });
            }

            try {
                assertType<Foo>({ foo: 'foo' });
            } catch (error) {
                assert.deepStrictEqual(error instanceof TypeGuardError, true);
                assert.deepStrictEqual(error.path, ['$']);
                assert.deepStrictEqual(error.reason, { type: 'missing-property', property: 'bar' });
            }

            try {
                assertType<Foo>({ foo: 'foo', bar: null });
            } catch (error) {
                assert.deepStrictEqual(error instanceof TypeGuardError, true);
                assert.deepStrictEqual(error.path, ['$', 'bar']);
                assert.deepStrictEqual(error.reason, { type: 'object' });
            }

            try {
                assertType<Foo>({ foo: 'foo', bar: {} });
            } catch (error) {
                assert.deepStrictEqual(error instanceof TypeGuardError, true);
                assert.deepStrictEqual(error.path, ['$', 'bar']);
                assert.deepStrictEqual(error.reason, { type: 'missing-property', property: 'values' });
            }

            try {
                assertType<Foo>({ foo: 'foo', bar: { values: ['bar'], index: 'bar' } });
            } catch (error) {
                assert.deepStrictEqual(error instanceof TypeGuardError, true);
                assert.deepStrictEqual(error.path, ['$', 'bar', 'index']);
                assert.deepStrictEqual(error.reason, { type: 'number' });
            }
        });
    });
});
