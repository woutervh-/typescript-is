import * as assert from 'assert';
import { is } from '../index';

describe('is', () => {
    describe('is<keyof { foo: \'foo\', bar: \'bar\' }>', () => {
        it('', () => {
            assert.strictEqual(is<keyof { foo: 'foo', bar: 'bar' }>('foo'), true);
            assert.strictEqual(is<keyof { foo: 'foo', bar: 'bar' }>('bar'), true);
        });

        it('', () => {
            assert.strictEqual(is<keyof { foo: 'foo', bar: 'bar' }>(''), false);
            assert.strictEqual(is<keyof { foo: 'foo', bar: 'bar' }>('foobar'), false);
        });

        it('', () => {
            assert.strictEqual(is<keyof { foo: 'foo', bar: 'bar' }>(0), false);
            assert.strictEqual(is<keyof { foo: 'foo', bar: 'bar' }>(Number.NaN), false);
            assert.strictEqual(is<keyof { foo: 'foo', bar: 'bar' }>(true), false);
            assert.strictEqual(is<keyof { foo: 'foo', bar: 'bar' }>(null), false);
            assert.strictEqual(is<keyof { foo: 'foo', bar: 'bar' }>(undefined), false);
            assert.strictEqual(is<keyof { foo: 'foo', bar: 'bar' }>({}), false);
            assert.strictEqual(is<keyof { foo: 'foo', bar: 'bar' }>([]), false);
        });
    });

    describe('is<>', () => {
        interface MyNestedObject {
            info: string;
        }

        interface MyObject {
            id: number;
            nested: MyNestedObject;
        }

        interface Left<T> {
            type: 'left';
            key: keyof T;
            valueT: T[keyof T];
        }

        interface Middle<T, U> {
            type: 'middle';
            key: keyof T | keyof U;
            valueT: T[keyof T];
            valueU: U[keyof U];
        }

        interface Right<U> {
            type: 'right';
            key: keyof U;
            valueU: U[keyof U];
        }

        type Choice<T, U> = Left<T> | Middle<T, U> | Right<U>;

        it('should return', () => {
            assert.strictEqual(is<Choice<{} | MyObject, MyObject>>({ type: 'left', key: 'id', valueT: 0 }), true);
            assert.strictEqual(is<Choice<{} | MyObject, MyObject>>({ type: 'middle', key: 'id', valueT: 0, valueU: 1 }), true);
            assert.strictEqual(is<Choice<{} | MyObject, MyObject>>({ type: 'right', key: 'id', valueU: 1 }), true);
        });
    });
});
