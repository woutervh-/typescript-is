import * as assert from 'assert';
import { is } from '../index';

describe('is', () => {
    describe('is<{ optional?: any }>', () => {
        it('should return true for any object', () => {
            assert.strictEqual(is<{ optional?: any }>({}), true);
            assert.strictEqual(is<{ optional?: any }>({ a: 'a' }), true);
            assert.strictEqual(is<{ optional?: any }>({ optional: 0 }), true);
            assert.strictEqual(is<{ optional?: any }>({ optional: 'a' }), true);
            assert.strictEqual(is<{ optional?: any }>({ optional: {} }), true);
            assert.strictEqual(is<{ optional?: any }>({ optional: [] }), true);
            assert.strictEqual(is<{ optional?: any }>({ optional: undefined }), true);
            assert.strictEqual(is<{ optional?: any }>({ optional: null }), true);
        });

        it('should return false for non-objects', () => {
            assert.strictEqual(is<{ optional?: any }>(true), false);
            assert.strictEqual(is<{ optional?: any }>(false), false);
            assert.strictEqual(is<{ optional?: any }>(0), false);
            assert.strictEqual(is<{ optional?: any }>(1), false);
            assert.strictEqual(is<{ optional?: any }>([]), false);
            assert.strictEqual(is<{ optional?: any }>(''), false);
            assert.strictEqual(is<{ optional?: any }>(null), false);
            assert.strictEqual(is<{ optional?: any }>(undefined), false);
        });
    });

    describe('is<{ optional?: boolean }>', () => {
        it('should return true for objects that optionally have the boolean property', () => {
            assert.strictEqual(is<{ optional?: boolean }>({}), true);
            assert.strictEqual(is<{ optional?: boolean }>({ a: 'a' }), true);
            assert.strictEqual(is<{ optional?: boolean }>({ optional: true }), true);
            assert.strictEqual(is<{ optional?: boolean }>({ optional: false }), true);
            assert.strictEqual(is<{ optional?: boolean }>({ a: 'b', optional: true }), true);
        });

        it('should return false for non-objects', () => {
            assert.strictEqual(is<{ optional?: boolean }>(true), false);
            assert.strictEqual(is<{ optional?: boolean }>(false), false);
            assert.strictEqual(is<{ optional?: boolean }>(0), false);
            assert.strictEqual(is<{ optional?: boolean }>(1), false);
            assert.strictEqual(is<{ optional?: boolean }>([]), false);
            assert.strictEqual(is<{ optional?: boolean }>(''), false);
            assert.strictEqual(is<{ optional?: boolean }>(null), false);
            assert.strictEqual(is<{ optional?: boolean }>(undefined), false);
        });

        it('should return false for objects that have a non-boolean optional property', () => {
            assert.strictEqual(is<{ optional?: boolean }>({ optional: 0 }), false);
            assert.strictEqual(is<{ optional?: boolean }>({ optional: '' }), false);
            assert.strictEqual(is<{ optional?: boolean }>({ optional: null }), false);
            assert.strictEqual(is<{ optional?: boolean }>({ optional: undefined }), false);
            assert.strictEqual(is<{ optional?: boolean }>({ optional: {} }), false);
            assert.strictEqual(is<{ optional?: boolean }>({ optional: [] }), false);
        });
    });

    describe('is<{ [Key: string]: boolean, foo: boolean }>', () => {
        it('should return true for objects that have a required and any optional boolean properties', () => {
            assert.strictEqual(is<{ [Key: string]: boolean, foo: boolean }>({ foo: true }), true);
            assert.strictEqual(is<{ [Key: string]: boolean, foo: boolean }>({ foo: false }), true);
            assert.strictEqual(is<{ [Key: string]: boolean, foo: boolean }>({ foo: false, bar: true }), true);
            assert.strictEqual(is<{ [Key: string]: boolean, foo: boolean }>({ foo: false, bar: false }), true);
            assert.strictEqual(is<{ [Key: string]: boolean, foo: boolean }>({ foo: true, bar: true }), true);
            assert.strictEqual(is<{ [Key: string]: boolean, foo: boolean }>({ foo: true, bar: false }), true);
            assert.strictEqual(is<{ [Key: string]: boolean, foo: boolean }>({ foo: true, bar: true, baz: true }), true);
        });

        it('should return false for objects that are missing a required boolean properties', () => {
            assert.strictEqual(is<{ [Key: string]: boolean, foo: boolean }>({}), false);
            assert.strictEqual(is<{ [Key: string]: boolean, foo: boolean }>({ bar: true }), false);
            assert.strictEqual(is<{ [Key: string]: boolean, foo: boolean }>({ bar: false }), false);
            assert.strictEqual(is<{ [Key: string]: boolean, foo: boolean }>({ bar: true }), false);
            assert.strictEqual(is<{ [Key: string]: boolean, foo: boolean }>({ bar: false }), false);
            assert.strictEqual(is<{ [Key: string]: boolean, foo: boolean }>({ bar: true, baz: true }), false);
        });

        it('should return false for various other non-objects', () => {
            assert.strictEqual(is<{ [Key: string]: boolean, foo: boolean }>([]), false);
            assert.strictEqual(is<{ [Key: string]: boolean, foo: boolean }>(true), false);
            assert.strictEqual(is<{ [Key: string]: boolean, foo: boolean }>(false), false);
            assert.strictEqual(is<{ [Key: string]: boolean, foo: boolean }>(0), false);
            assert.strictEqual(is<{ [Key: string]: boolean, foo: boolean }>(''), false);
            assert.strictEqual(is<{ [Key: string]: boolean, foo: boolean }>(null), false);
            assert.strictEqual(is<{ [Key: string]: boolean, foo: boolean }>(undefined), false);
        });

        it('should return false for objects that have non-boolean properties', () => {
            assert.strictEqual(is<{ [Key: string]: boolean, foo: boolean }>({ foo: 0 }), false);
            assert.strictEqual(is<{ [Key: string]: boolean, foo: boolean }>({ foo: '' }), false);
            assert.strictEqual(is<{ [Key: string]: boolean, foo: boolean }>({ foo: null }), false);
            assert.strictEqual(is<{ [Key: string]: boolean, foo: boolean }>({ foo: true, bar: 0 }), false);
            assert.strictEqual(is<{ [Key: string]: boolean, foo: boolean }>({ foo: true, bar: '' }), false);
            assert.strictEqual(is<{ [Key: string]: boolean, foo: boolean }>({ foo: true, bar: null }), false);
            assert.strictEqual(is<{ [Key: string]: boolean, foo: boolean }>({ foo: 0, bar: true }), false);
            assert.strictEqual(is<{ [Key: string]: boolean, foo: boolean }>({ foo: '', bar: true }), false);
            assert.strictEqual(is<{ [Key: string]: boolean, foo: boolean }>({ foo: null, bar: true }), false);
        });
    });
});
