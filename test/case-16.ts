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
            assert.strictEqual(is<{ [Key in keyof { foo: any, bar: any }]: string }>({ foo: '', bar: '' }), true);
            assert.strictEqual(is<{ [Key in keyof { foo: any, bar: any }]: string }>({ foo: 'foo', bar: 'bar' }), true);
        });

        it('should return false for objects with foo and bar that are not strings', () => {
            assert.strictEqual(is<{ [Key in keyof { foo: any, bar: any }]: string }>({ foo: null, bar: '' }), false);
            assert.strictEqual(is<{ [Key in keyof { foo: any, bar: any }]: string }>({ foo: '', bar: 1 }), false);
            assert.strictEqual(is<{ [Key in keyof { foo: any, bar: any }]: string }>({ foo: true, bar: [] }), false);
        });

        it('should return false for objects with foo or bar missing', () => {
            assert.strictEqual(is<{ [Key in keyof { foo: any, bar: any }]: string }>({}), false);
            assert.strictEqual(is<{ [Key in keyof { foo: any, bar: any }]: string }>({ foo: 'foo' }), false);
            assert.strictEqual(is<{ [Key in keyof { foo: any, bar: any }]: string }>({ bar: 'bar' }), false);
        });

        it('should return false for other non-objects', () => {
            assert.strictEqual(is<{ [Key in keyof { foo: any, bar: any }]: string }>([]), false);
            assert.strictEqual(is<{ [Key in keyof { foo: any, bar: any }]: string }>(null), false);
            assert.strictEqual(is<{ [Key in keyof { foo: any, bar: any }]: string }>(undefined), false);
            assert.strictEqual(is<{ [Key in keyof { foo: any, bar: any }]: string }>(true), false);
            assert.strictEqual(is<{ [Key in keyof { foo: any, bar: any }]: string }>(1), false);
            assert.strictEqual(is<{ [Key in keyof { foo: any, bar: any }]: string }>('foo'), false);
        });
    });

    describe('is<InterfaceWithDefaultTypeParameter>', () => {
        it('should return true for objects with value \'foo\'', () => {
            assert.strictEqual(is<InterfaceWithDefaultTypeParameter>({ value: 'foo' }), true);
        });

        it('should return false for objects with value not equal to \'foo\'', () => {
            assert.strictEqual(is<InterfaceWithDefaultTypeParameter>({ value: undefined }), false);
            assert.strictEqual(is<InterfaceWithDefaultTypeParameter>({ value: null }), false);
            assert.strictEqual(is<InterfaceWithDefaultTypeParameter>({ value: 0 }), false);
            assert.strictEqual(is<InterfaceWithDefaultTypeParameter>({ value: true }), false);
            assert.strictEqual(is<InterfaceWithDefaultTypeParameter>({ value: 'bar' }), false);
        });

        it('should return false for objects missing value', () => {
            assert.strictEqual(is<InterfaceWithDefaultTypeParameter>({}), false);
            assert.strictEqual(is<InterfaceWithDefaultTypeParameter>({ bar: 'foo' }), false);
            assert.strictEqual(is<InterfaceWithDefaultTypeParameter>({ bar: 'bar' }), false);
        });

        it('should return false for other types', () => {
            assert.strictEqual(is<InterfaceWithDefaultTypeParameter>(undefined), false);
            assert.strictEqual(is<InterfaceWithDefaultTypeParameter>(null), false);
            assert.strictEqual(is<InterfaceWithDefaultTypeParameter>(0), false);
            assert.strictEqual(is<InterfaceWithDefaultTypeParameter>(1), false);
            assert.strictEqual(is<InterfaceWithDefaultTypeParameter>(true), false);
            assert.strictEqual(is<InterfaceWithDefaultTypeParameter>(false), false);
            assert.strictEqual(is<InterfaceWithDefaultTypeParameter>([]), false);
        });
    });

    describe('is<InterfaceWithDefaultTypeParameter<\'bar\'>>', () => {
        it('should return true for objects with value \'bar\'', () => {
            assert.strictEqual(is<InterfaceWithDefaultTypeParameter<'bar'>>({ value: 'bar' }), true);
        });

        it('should return false for objects with value not equal to \'bar\'', () => {
            assert.strictEqual(is<InterfaceWithDefaultTypeParameter<'bar'>>({ value: undefined }), false);
            assert.strictEqual(is<InterfaceWithDefaultTypeParameter<'bar'>>({ value: null }), false);
            assert.strictEqual(is<InterfaceWithDefaultTypeParameter<'bar'>>({ value: 0 }), false);
            assert.strictEqual(is<InterfaceWithDefaultTypeParameter<'bar'>>({ value: true }), false);
            assert.strictEqual(is<InterfaceWithDefaultTypeParameter<'bar'>>({ value: 'foo' }), false);
        });

        it('should return false for objects missing value', () => {
            assert.strictEqual(is<InterfaceWithDefaultTypeParameter<'bar'>>({}), false);
            assert.strictEqual(is<InterfaceWithDefaultTypeParameter<'bar'>>({ bar: 'foo' }), false);
            assert.strictEqual(is<InterfaceWithDefaultTypeParameter<'bar'>>({ bar: 'bar' }), false);
        });

        it('should return false for other types', () => {
            assert.strictEqual(is<InterfaceWithDefaultTypeParameter<'bar'>>(undefined), false);
            assert.strictEqual(is<InterfaceWithDefaultTypeParameter<'bar'>>(null), false);
            assert.strictEqual(is<InterfaceWithDefaultTypeParameter<'bar'>>(0), false);
            assert.strictEqual(is<InterfaceWithDefaultTypeParameter<'bar'>>(1), false);
            assert.strictEqual(is<InterfaceWithDefaultTypeParameter<'bar'>>(true), false);
            assert.strictEqual(is<InterfaceWithDefaultTypeParameter<'bar'>>(false), false);
            assert.strictEqual(is<InterfaceWithDefaultTypeParameter<'bar'>>([]), false);
        });
    });

    describe('is<InterfaceWithNestedDefaultTypeParameter>', () => {
        it('should return true for objects with nested value \'baz\'', () => {
            assert.strictEqual(is<InterfaceWithNestedDefaultTypeParameter>({ nested: { value: 'baz' } }), true);
        });

        it('should return false for objects with nested value not equal to \'bar\'', () => {
            assert.strictEqual(is<InterfaceWithNestedDefaultTypeParameter>({ nested: { value: undefined } }), false);
            assert.strictEqual(is<InterfaceWithNestedDefaultTypeParameter>({ nested: { value: null } }), false);
            assert.strictEqual(is<InterfaceWithNestedDefaultTypeParameter>({ nested: { value: 0 } }), false);
            assert.strictEqual(is<InterfaceWithNestedDefaultTypeParameter>({ nested: { value: true } }), false);
            assert.strictEqual(is<InterfaceWithNestedDefaultTypeParameter>({ nested: { value: 'foo' } }), false);
        });

        it('should return false for objects with nested missing value', () => {
            assert.strictEqual(is<InterfaceWithNestedDefaultTypeParameter>({ nested: {} }), false);
            assert.strictEqual(is<InterfaceWithNestedDefaultTypeParameter>({ nested: { bar: 'foo' } }), false);
            assert.strictEqual(is<InterfaceWithNestedDefaultTypeParameter>({ nested: { bar: 'bar' } }), false);
        });

        it('should return false for other types', () => {
            assert.strictEqual(is<InterfaceWithNestedDefaultTypeParameter>(undefined), false);
            assert.strictEqual(is<InterfaceWithNestedDefaultTypeParameter>(null), false);
            assert.strictEqual(is<InterfaceWithNestedDefaultTypeParameter>(0), false);
            assert.strictEqual(is<InterfaceWithNestedDefaultTypeParameter>(1), false);
            assert.strictEqual(is<InterfaceWithNestedDefaultTypeParameter>(true), false);
            assert.strictEqual(is<InterfaceWithNestedDefaultTypeParameter>(false), false);
            assert.strictEqual(is<InterfaceWithNestedDefaultTypeParameter>([]), false);
            assert.strictEqual(is<InterfaceWithNestedDefaultTypeParameter>({}), false);
            assert.strictEqual(is<InterfaceWithNestedDefaultTypeParameter>({ not: { value: 'baz' } }), false);
        });
    });
});
