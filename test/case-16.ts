import * as assert from 'assert';
import { is } from '../index';

describe('is', () => {
    interface InterfaceWithDefaultTypeParameter<T extends string = 'foo'> {
        value: T;
    }

    interface InterfaceWithNestedDefaultTypeParameter<T extends string = 'baz'> {
        nested: InterfaceWithDefaultTypeParameter<T>;
    }

    describe('is<{ [Key in keyof { foo: any, bar: any }]: string }>', () => {
        it('should return true for objects with foo and bar that are strings', () => {
            assert.deepStrictEqual(is<{ [Key in keyof { foo: any, bar: any }]: string }>({ foo: '', bar: '' }), true);
            assert.deepStrictEqual(is<{ [Key in keyof { foo: any, bar: any }]: string }>({ foo: 'foo', bar: 'bar' }), true);
        });

        it('should return false for objects with foo and bar that are not strings', () => {
            assert.deepStrictEqual(is<{ [Key in keyof { foo: any, bar: any }]: string }>({ foo: null, bar: '' }), false);
            assert.deepStrictEqual(is<{ [Key in keyof { foo: any, bar: any }]: string }>({ foo: '', bar: 1 }), false);
            assert.deepStrictEqual(is<{ [Key in keyof { foo: any, bar: any }]: string }>({ foo: true, bar: [] }), false);
        });

        it('should return false for objects with foo or bar missing', () => {
            assert.deepStrictEqual(is<{ [Key in keyof { foo: any, bar: any }]: string }>({}), false);
            assert.deepStrictEqual(is<{ [Key in keyof { foo: any, bar: any }]: string }>({ foo: 'foo' }), false);
            assert.deepStrictEqual(is<{ [Key in keyof { foo: any, bar: any }]: string }>({ bar: 'bar' }), false);
        });

        it('should return false for other non-objects', () => {
            assert.deepStrictEqual(is<{ [Key in keyof { foo: any, bar: any }]: string }>([]), false);
            assert.deepStrictEqual(is<{ [Key in keyof { foo: any, bar: any }]: string }>(null), false);
            assert.deepStrictEqual(is<{ [Key in keyof { foo: any, bar: any }]: string }>(undefined), false);
            assert.deepStrictEqual(is<{ [Key in keyof { foo: any, bar: any }]: string }>(true), false);
            assert.deepStrictEqual(is<{ [Key in keyof { foo: any, bar: any }]: string }>(1), false);
            assert.deepStrictEqual(is<{ [Key in keyof { foo: any, bar: any }]: string }>('foo'), false);
        });
    });

    describe('is<InterfaceWithDefaultTypeParameter>', () => {
        it('should return true for objects with value \'foo\'', () => {
            assert.deepStrictEqual(is<InterfaceWithDefaultTypeParameter>({ value: 'foo' }), true);
        });

        it('should return false for objects with value not equal to \'foo\'', () => {
            assert.deepStrictEqual(is<InterfaceWithDefaultTypeParameter>({ value: undefined }), false);
            assert.deepStrictEqual(is<InterfaceWithDefaultTypeParameter>({ value: null }), false);
            assert.deepStrictEqual(is<InterfaceWithDefaultTypeParameter>({ value: 0 }), false);
            assert.deepStrictEqual(is<InterfaceWithDefaultTypeParameter>({ value: true }), false);
            assert.deepStrictEqual(is<InterfaceWithDefaultTypeParameter>({ value: 'bar' }), false);
        });

        it('should return false for objects missing value', () => {
            assert.deepStrictEqual(is<InterfaceWithDefaultTypeParameter>({}), false);
            assert.deepStrictEqual(is<InterfaceWithDefaultTypeParameter>({ bar: 'foo' }), false);
            assert.deepStrictEqual(is<InterfaceWithDefaultTypeParameter>({ bar: 'bar' }), false);
        });

        it('should return false for other types', () => {
            assert.deepStrictEqual(is<InterfaceWithDefaultTypeParameter>(undefined), false);
            assert.deepStrictEqual(is<InterfaceWithDefaultTypeParameter>(null), false);
            assert.deepStrictEqual(is<InterfaceWithDefaultTypeParameter>(0), false);
            assert.deepStrictEqual(is<InterfaceWithDefaultTypeParameter>(1), false);
            assert.deepStrictEqual(is<InterfaceWithDefaultTypeParameter>(true), false);
            assert.deepStrictEqual(is<InterfaceWithDefaultTypeParameter>(false), false);
            assert.deepStrictEqual(is<InterfaceWithDefaultTypeParameter>([]), false);
        });
    });

    describe('is<InterfaceWithDefaultTypeParameter<\'bar\'>>', () => {
        it('should return true for objects with value \'bar\'', () => {
            assert.deepStrictEqual(is<InterfaceWithDefaultTypeParameter<'bar'>>({ value: 'bar' }), true);
        });

        it('should return false for objects with value not equal to \'bar\'', () => {
            assert.deepStrictEqual(is<InterfaceWithDefaultTypeParameter<'bar'>>({ value: undefined }), false);
            assert.deepStrictEqual(is<InterfaceWithDefaultTypeParameter<'bar'>>({ value: null }), false);
            assert.deepStrictEqual(is<InterfaceWithDefaultTypeParameter<'bar'>>({ value: 0 }), false);
            assert.deepStrictEqual(is<InterfaceWithDefaultTypeParameter<'bar'>>({ value: true }), false);
            assert.deepStrictEqual(is<InterfaceWithDefaultTypeParameter<'bar'>>({ value: 'foo' }), false);
        });

        it('should return false for objects missing value', () => {
            assert.deepStrictEqual(is<InterfaceWithDefaultTypeParameter<'bar'>>({}), false);
            assert.deepStrictEqual(is<InterfaceWithDefaultTypeParameter<'bar'>>({ bar: 'foo' }), false);
            assert.deepStrictEqual(is<InterfaceWithDefaultTypeParameter<'bar'>>({ bar: 'bar' }), false);
        });

        it('should return false for other types', () => {
            assert.deepStrictEqual(is<InterfaceWithDefaultTypeParameter<'bar'>>(undefined), false);
            assert.deepStrictEqual(is<InterfaceWithDefaultTypeParameter<'bar'>>(null), false);
            assert.deepStrictEqual(is<InterfaceWithDefaultTypeParameter<'bar'>>(0), false);
            assert.deepStrictEqual(is<InterfaceWithDefaultTypeParameter<'bar'>>(1), false);
            assert.deepStrictEqual(is<InterfaceWithDefaultTypeParameter<'bar'>>(true), false);
            assert.deepStrictEqual(is<InterfaceWithDefaultTypeParameter<'bar'>>(false), false);
            assert.deepStrictEqual(is<InterfaceWithDefaultTypeParameter<'bar'>>([]), false);
        });
    });

    describe('is<InterfaceWithNestedDefaultTypeParameter>', () => {
        it('should return true for objects with nested value \'baz\'', () => {
            assert.deepStrictEqual(is<InterfaceWithNestedDefaultTypeParameter>({ nested: { value: 'baz' } }), true);
        });

        it('should return false for objects with nested value not equal to \'bar\'', () => {
            assert.deepStrictEqual(is<InterfaceWithNestedDefaultTypeParameter>({ nested: { value: undefined } }), false);
            assert.deepStrictEqual(is<InterfaceWithNestedDefaultTypeParameter>({ nested: { value: null } }), false);
            assert.deepStrictEqual(is<InterfaceWithNestedDefaultTypeParameter>({ nested: { value: 0 } }), false);
            assert.deepStrictEqual(is<InterfaceWithNestedDefaultTypeParameter>({ nested: { value: true } }), false);
            assert.deepStrictEqual(is<InterfaceWithNestedDefaultTypeParameter>({ nested: { value: 'foo' } }), false);
        });

        it('should return false for objects with nested missing value', () => {
            assert.deepStrictEqual(is<InterfaceWithNestedDefaultTypeParameter>({ nested: {} }), false);
            assert.deepStrictEqual(is<InterfaceWithNestedDefaultTypeParameter>({ nested: { bar: 'foo' } }), false);
            assert.deepStrictEqual(is<InterfaceWithNestedDefaultTypeParameter>({ nested: { bar: 'bar' } }), false);
        });

        it('should return false for other types', () => {
            assert.deepStrictEqual(is<InterfaceWithNestedDefaultTypeParameter>(undefined), false);
            assert.deepStrictEqual(is<InterfaceWithNestedDefaultTypeParameter>(null), false);
            assert.deepStrictEqual(is<InterfaceWithNestedDefaultTypeParameter>(0), false);
            assert.deepStrictEqual(is<InterfaceWithNestedDefaultTypeParameter>(1), false);
            assert.deepStrictEqual(is<InterfaceWithNestedDefaultTypeParameter>(true), false);
            assert.deepStrictEqual(is<InterfaceWithNestedDefaultTypeParameter>(false), false);
            assert.deepStrictEqual(is<InterfaceWithNestedDefaultTypeParameter>([]), false);
            assert.deepStrictEqual(is<InterfaceWithNestedDefaultTypeParameter>({}), false);
            assert.deepStrictEqual(is<InterfaceWithNestedDefaultTypeParameter>({ not: { value: 'baz' } }), false);
        });
    });
});
