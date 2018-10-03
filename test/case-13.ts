import * as assert from 'assert';
import { is } from '../index';

describe('is', () => {
    describe('is<keyof { foo: any, bar: never }>', () => {
        it('should return true for \'foo\' and \'bar\'', () => {
            assert.strictEqual(is<keyof { foo: any, bar: never }>('foo'), true);
            assert.strictEqual(is<keyof { foo: any, bar: never }>('bar'), true);
        });

        it('should return false for other strings', () => {
            assert.strictEqual(is<keyof { foo: any, bar: never }>(''), false);
            assert.strictEqual(is<keyof { foo: any, bar: never }>('foobar'), false);
        });

        it('should return false for other non-strings', () => {
            assert.strictEqual(is<keyof { foo: any, bar: never }>(0), false);
            assert.strictEqual(is<keyof { foo: any, bar: never }>(Number.NaN), false);
            assert.strictEqual(is<keyof { foo: any, bar: never }>(true), false);
            assert.strictEqual(is<keyof { foo: any, bar: never }>(null), false);
            assert.strictEqual(is<keyof { foo: any, bar: never }>(undefined), false);
            assert.strictEqual(is<keyof { foo: any, bar: never }>({}), false);
            assert.strictEqual(is<keyof { foo: any, bar: never }>([]), false);
        });
    });

    describe('is<Choice<MyOtherObject | MyObject, MyObject>>', () => {
        interface MyNestedObject {
            info: string;
        }

        interface MyOtherObject {
            id: number;
        }

        interface MyObject extends MyOtherObject {
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

        it('should return true for objects that are valid choices', () => {
            assert.strictEqual(is<Choice<MyOtherObject | MyObject, MyObject>>({ type: 'left', key: 'id', valueT: 0 }), true);
            assert.strictEqual(is<Choice<MyOtherObject | MyObject, MyObject>>({ type: 'middle', key: 'id', valueT: 1, valueU: 2 }), true);
            assert.strictEqual(is<Choice<MyOtherObject | MyObject, MyObject>>({ type: 'middle', key: 'id', valueT: 3, valueU: { info: 'foo' } }), true);
            assert.strictEqual(is<Choice<MyOtherObject | MyObject, MyObject>>({ type: 'middle', key: 'nested', valueT: 4, valueU: 5 }), true);
            assert.strictEqual(is<Choice<MyOtherObject | MyObject, MyObject>>({ type: 'middle', key: 'nested', valueT: 6, valueU: { info: 'foo' } }), true);
            assert.strictEqual(is<Choice<MyOtherObject | MyObject, MyObject>>({ type: 'right', key: 'id', valueU: 7 }), true);
            assert.strictEqual(is<Choice<MyOtherObject | MyObject, MyObject>>({ type: 'right', key: 'nested', valueU: 8 }), true);
            assert.strictEqual(is<Choice<MyOtherObject | MyObject, MyObject>>({ type: 'right', key: 'nested', valueU: { info: 'bar' } }), true);
        });

        it('should return false for objects that are not valic choices', () => {
            assert.strictEqual(is<Choice<MyOtherObject | MyObject, MyObject>>({}), false);
            assert.strictEqual(is<Choice<MyOtherObject | MyObject, MyObject>>({ type: 'wrong' }), false);
            assert.strictEqual(is<Choice<MyOtherObject | MyObject, MyObject>>({ type: 'wrong', key: 'id', valueT: 0 }), false);
            assert.strictEqual(is<Choice<MyOtherObject | MyObject, MyObject>>({ type: 'left' }), false);
            assert.strictEqual(is<Choice<MyOtherObject | MyObject, MyObject>>({ type: 'left', key: 'id' }), false);
            assert.strictEqual(is<Choice<MyOtherObject | MyObject, MyObject>>({ type: 'left', valueT: 0 }), false);
            assert.strictEqual(is<Choice<MyOtherObject | MyObject, MyObject>>({ type: 'left', key: 'id', valueT: null }), false);
            assert.strictEqual(is<Choice<MyOtherObject | MyObject, MyObject>>({ type: 'left', key: 'id', valueT: '' }), false);
            assert.strictEqual(is<Choice<MyOtherObject | MyObject, MyObject>>({ type: 'left', key: 'id', valueT: { info: 'baz' } }), false);
            assert.strictEqual(is<Choice<MyOtherObject | MyObject, MyObject>>({ type: 'left', key: 'wrong', valueT: 0 }), false);
            assert.strictEqual(is<Choice<MyOtherObject | MyObject, MyObject>>({ type: 'middle' }), false);
            assert.strictEqual(is<Choice<MyOtherObject | MyObject, MyObject>>({ type: 'middle', key: 'id' }), false);
            assert.strictEqual(is<Choice<MyOtherObject | MyObject, MyObject>>({ type: 'middle', key: 'id', valueT: 1 }), false);
            assert.strictEqual(is<Choice<MyOtherObject | MyObject, MyObject>>({ type: 'middle', key: 'id', valueU: 2 }), false);
            assert.strictEqual(is<Choice<MyOtherObject | MyObject, MyObject>>({ type: 'middle', key: 'wrong', valueT: 1, valueU: 2 }), false);
            assert.strictEqual(is<Choice<MyOtherObject | MyObject, MyObject>>({ type: 'middle', key: 'id', valueT: { info: 'foo' }, valueU: { info: 'foo' } }), false);
            assert.strictEqual(is<Choice<MyOtherObject | MyObject, MyObject>>({ type: 'right' }), false);
            assert.strictEqual(is<Choice<MyOtherObject | MyObject, MyObject>>({ type: 'right', key: 'quux', valueU: 8 }), false);
            assert.strictEqual(is<Choice<MyOtherObject | MyObject, MyObject>>({ type: 'right', key: 'quux', valueU: { info: 'bar' } }), false);
        });

        it('should return false for non-objects', () => {
            assert.strictEqual(is<Choice<MyOtherObject | MyObject, MyObject>>([]), false);
            assert.strictEqual(is<Choice<MyOtherObject | MyObject, MyObject>>(null), false);
            assert.strictEqual(is<Choice<MyOtherObject | MyObject, MyObject>>(undefined), false);
            assert.strictEqual(is<Choice<MyOtherObject | MyObject, MyObject>>(0), false);
            assert.strictEqual(is<Choice<MyOtherObject | MyObject, MyObject>>(1), false);
            assert.strictEqual(is<Choice<MyOtherObject | MyObject, MyObject>>(false), false);
            assert.strictEqual(is<Choice<MyOtherObject | MyObject, MyObject>>(true), false);
        });
    });

    describe('is<Extractor<{} | Item>>', () => {
        interface Item {
            foo: 'bar';
        }

        interface Extractor<T> {
            key: keyof T;
            valueT: T[keyof T];
        }

        it('should always return false', () => {
            assert.strictEqual(is<Extractor<{} | Item>>(0), false);
            assert.strictEqual(is<Extractor<{} | Item>>(1), false);
            assert.strictEqual(is<Extractor<{} | Item>>(true), false);
            assert.strictEqual(is<Extractor<{} | Item>>(false), false);
            assert.strictEqual(is<Extractor<{} | Item>>(''), false);
            assert.strictEqual(is<Extractor<{} | Item>>('a'), false);
            assert.strictEqual(is<Extractor<{} | Item>>({}), false);
            assert.strictEqual(is<Extractor<{} | Item>>([]), false);
            assert.strictEqual(is<Extractor<{} | Item>>(null), false);
            assert.strictEqual(is<Extractor<{} | Item>>(undefined), false);
        });
    });

    describe('is<keyof {}>', () => {
        it('should always return false', () => {
            assert.strictEqual(is<keyof {}>(0), false);
            assert.strictEqual(is<keyof {}>(1), false);
            assert.strictEqual(is<keyof {}>(true), false);
            assert.strictEqual(is<keyof {}>(false), false);
            assert.strictEqual(is<keyof {}>(''), false);
            assert.strictEqual(is<keyof {}>('a'), false);
            assert.strictEqual(is<keyof {}>({}), false);
            assert.strictEqual(is<keyof {}>([]), false);
            assert.strictEqual(is<keyof {}>(null), false);
            assert.strictEqual(is<keyof {}>(undefined), false);
        });
    });

    describe('is<{}[keyof {}]>', () => {
        it('should always return false', () => {
            assert.strictEqual(is<{}[keyof {}]>(0), false);
            assert.strictEqual(is<{}[keyof {}]>(1), false);
            assert.strictEqual(is<{}[keyof {}]>(true), false);
            assert.strictEqual(is<{}[keyof {}]>(false), false);
            assert.strictEqual(is<{}[keyof {}]>(''), false);
            assert.strictEqual(is<{}[keyof {}]>('a'), false);
            assert.strictEqual(is<{}[keyof {}]>({}), false);
            assert.strictEqual(is<{}[keyof {}]>([]), false);
            assert.strictEqual(is<{}[keyof {}]>(null), false);
            assert.strictEqual(is<{}[keyof {}]>(undefined), false);
        });
    });
});
