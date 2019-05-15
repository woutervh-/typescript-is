import * as assert from 'assert';
import { is } from '../index';

describe('is', () => {
    describe('is<{ optional?: any }>', () => {
        it('should return true for any object', () => {
            assert.deepStrictEqual(is<{ optional?: any }>({}), true);
            assert.deepStrictEqual(is<{ optional?: any }>({ a: 'a' }), true);
            assert.deepStrictEqual(is<{ optional?: any }>({ optional: 0 }), true);
            assert.deepStrictEqual(is<{ optional?: any }>({ optional: 'a' }), true);
            assert.deepStrictEqual(is<{ optional?: any }>({ optional: {} }), true);
            assert.deepStrictEqual(is<{ optional?: any }>({ optional: [] }), true);
            assert.deepStrictEqual(is<{ optional?: any }>({ optional: undefined }), true);
            assert.deepStrictEqual(is<{ optional?: any }>({ optional: null }), true);
        });

        it('should return false for non-objects', () => {
            assert.deepStrictEqual(is<{ optional?: any }>(true), false);
            assert.deepStrictEqual(is<{ optional?: any }>(false), false);
            assert.deepStrictEqual(is<{ optional?: any }>(0), false);
            assert.deepStrictEqual(is<{ optional?: any }>(1), false);
            assert.deepStrictEqual(is<{ optional?: any }>([]), false);
            assert.deepStrictEqual(is<{ optional?: any }>(''), false);
            assert.deepStrictEqual(is<{ optional?: any }>(null), false);
            assert.deepStrictEqual(is<{ optional?: any }>(undefined), false);
        });
    });

    describe('is<{ optional?: boolean }>', () => {
        it('should return true for objects that optionally have the boolean property', () => {
            assert.deepStrictEqual(is<{ optional?: boolean }>({}), true);
            assert.deepStrictEqual(is<{ optional?: boolean }>({ a: 'a' }), true);
            assert.deepStrictEqual(is<{ optional?: boolean }>({ optional: true }), true);
            assert.deepStrictEqual(is<{ optional?: boolean }>({ optional: false }), true);
            assert.deepStrictEqual(is<{ optional?: boolean }>({ a: 'b', optional: true }), true);
        });

        it('should return false for non-objects', () => {
            assert.deepStrictEqual(is<{ optional?: boolean }>(true), false);
            assert.deepStrictEqual(is<{ optional?: boolean }>(false), false);
            assert.deepStrictEqual(is<{ optional?: boolean }>(0), false);
            assert.deepStrictEqual(is<{ optional?: boolean }>(1), false);
            assert.deepStrictEqual(is<{ optional?: boolean }>([]), false);
            assert.deepStrictEqual(is<{ optional?: boolean }>(''), false);
            assert.deepStrictEqual(is<{ optional?: boolean }>(null), false);
            assert.deepStrictEqual(is<{ optional?: boolean }>(undefined), false);
        });

        it('should return false for objects that have a non-boolean optional property', () => {
            assert.deepStrictEqual(is<{ optional?: boolean }>({ optional: 0 }), false);
            assert.deepStrictEqual(is<{ optional?: boolean }>({ optional: '' }), false);
            assert.deepStrictEqual(is<{ optional?: boolean }>({ optional: null }), false);
            assert.deepStrictEqual(is<{ optional?: boolean }>({ optional: undefined }), false);
            assert.deepStrictEqual(is<{ optional?: boolean }>({ optional: {} }), false);
            assert.deepStrictEqual(is<{ optional?: boolean }>({ optional: [] }), false);
        });
    });

    describe('is<{ [Key: string]: boolean, foo: boolean }>', () => {
        it('should return true for objects that have a required and any optional boolean properties', () => {
            assert.deepStrictEqual(is<{ [Key: string]: boolean, foo: boolean }>({ foo: true }), true);
            assert.deepStrictEqual(is<{ [Key: string]: boolean, foo: boolean }>({ foo: false }), true);
            assert.deepStrictEqual(is<{ [Key: string]: boolean, foo: boolean }>({ foo: false, bar: true }), true);
            assert.deepStrictEqual(is<{ [Key: string]: boolean, foo: boolean }>({ foo: false, bar: false }), true);
            assert.deepStrictEqual(is<{ [Key: string]: boolean, foo: boolean }>({ foo: true, bar: true }), true);
            assert.deepStrictEqual(is<{ [Key: string]: boolean, foo: boolean }>({ foo: true, bar: false }), true);
            assert.deepStrictEqual(is<{ [Key: string]: boolean, foo: boolean }>({ foo: true, bar: true, baz: true }), true);
        });

        it('should return false for objects that are missing a required boolean properties', () => {
            assert.deepStrictEqual(is<{ [Key: string]: boolean, foo: boolean }>({}), false);
            assert.deepStrictEqual(is<{ [Key: string]: boolean, foo: boolean }>({ bar: true }), false);
            assert.deepStrictEqual(is<{ [Key: string]: boolean, foo: boolean }>({ bar: false }), false);
            assert.deepStrictEqual(is<{ [Key: string]: boolean, foo: boolean }>({ bar: true }), false);
            assert.deepStrictEqual(is<{ [Key: string]: boolean, foo: boolean }>({ bar: false }), false);
            assert.deepStrictEqual(is<{ [Key: string]: boolean, foo: boolean }>({ bar: true, baz: true }), false);
        });

        it('should return false for various other non-objects', () => {
            assert.deepStrictEqual(is<{ [Key: string]: boolean, foo: boolean }>([]), false);
            assert.deepStrictEqual(is<{ [Key: string]: boolean, foo: boolean }>(true), false);
            assert.deepStrictEqual(is<{ [Key: string]: boolean, foo: boolean }>(false), false);
            assert.deepStrictEqual(is<{ [Key: string]: boolean, foo: boolean }>(0), false);
            assert.deepStrictEqual(is<{ [Key: string]: boolean, foo: boolean }>(''), false);
            assert.deepStrictEqual(is<{ [Key: string]: boolean, foo: boolean }>(null), false);
            assert.deepStrictEqual(is<{ [Key: string]: boolean, foo: boolean }>(undefined), false);
        });

        it('should return false for objects that have non-boolean properties', () => {
            assert.deepStrictEqual(is<{ [Key: string]: boolean, foo: boolean }>({ foo: 0 }), false);
            assert.deepStrictEqual(is<{ [Key: string]: boolean, foo: boolean }>({ foo: '' }), false);
            assert.deepStrictEqual(is<{ [Key: string]: boolean, foo: boolean }>({ foo: null }), false);
            assert.deepStrictEqual(is<{ [Key: string]: boolean, foo: boolean }>({ foo: true, bar: 0 }), false);
            assert.deepStrictEqual(is<{ [Key: string]: boolean, foo: boolean }>({ foo: true, bar: '' }), false);
            assert.deepStrictEqual(is<{ [Key: string]: boolean, foo: boolean }>({ foo: true, bar: null }), false);
            assert.deepStrictEqual(is<{ [Key: string]: boolean, foo: boolean }>({ foo: 0, bar: true }), false);
            assert.deepStrictEqual(is<{ [Key: string]: boolean, foo: boolean }>({ foo: '', bar: true }), false);
            assert.deepStrictEqual(is<{ [Key: string]: boolean, foo: boolean }>({ foo: null, bar: true }), false);
        });
    });
});
