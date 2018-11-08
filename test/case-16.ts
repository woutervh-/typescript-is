import * as assert from 'assert';
import { is } from '../index';

describe('is', () => {
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
});
