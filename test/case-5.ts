import * as assert from 'assert';
import { is } from '../index';

describe('is', () => {
    describe('is<Alias>', () => {
        type SubAlias = number;

        type Alias = SubAlias;

        it('should return true for numbers', () => {
            assert.deepStrictEqual(is<Alias>(0), true);
            assert.deepStrictEqual(is<Alias>(1), true);
            assert.deepStrictEqual(is<Alias>(Number.NaN), true);
        });

        it('should return false for other literals', () => {
            assert.deepStrictEqual(is<Alias>(null), false);
            assert.deepStrictEqual(is<Alias>(undefined), false);
            assert.deepStrictEqual(is<Alias>({}), false);
            assert.deepStrictEqual(is<Alias>([]), false);
            assert.deepStrictEqual(is<Alias>(true), false);
            assert.deepStrictEqual(is<Alias>(false), false);
            assert.deepStrictEqual(is<Alias>(''), false);
            assert.deepStrictEqual(is<Alias>('a'), false);
        });
    });

    describe('is<Foo<number>>', () => {
        interface Baz<T> {
            [Key: string]: T;
        }

        interface Bar<T> extends Baz<T> { }

        interface Foo<T> extends Bar<T> { }

        it('should return true for objects matching the interface', () => {
            assert.deepStrictEqual(is<Foo<number>>({}), true);
            assert.deepStrictEqual(is<Foo<number>>({ a: 0, b: 1, c: -1, d: Number.NaN }), true);
            assert.deepStrictEqual(is<Foo<number>>({ 'unicode 😊': Number.POSITIVE_INFINITY }), true);
        });

        it('should return false for non-object literals', () => {
            assert.deepStrictEqual(is<Foo<number>>(null), false);
            assert.deepStrictEqual(is<Foo<number>>(undefined), false);
            assert.deepStrictEqual(is<Foo<number>>(0), false);
            assert.deepStrictEqual(is<Foo<number>>(1), false);
            assert.deepStrictEqual(is<Foo<number>>(''), false);
            assert.deepStrictEqual(is<Foo<number>>('a'), false);
            assert.deepStrictEqual(is<Foo<number>>(true), false);
            assert.deepStrictEqual(is<Foo<number>>(false), false);
        });

        it('should return false for objects not matching the interface', () => {
            assert.deepStrictEqual(is<Foo<number>>({ a: true }), false);
            assert.deepStrictEqual(is<Foo<number>>({ b: false }), false);
            assert.deepStrictEqual(is<Foo<number>>({ a: {} }), false);
            assert.deepStrictEqual(is<Foo<number>>({ b: [] }), false);
            assert.deepStrictEqual(is<Foo<number>>({ c: '' }), false);
            assert.deepStrictEqual(is<Foo<number>>({ d: 'a' }), false);
        });

        it('should return false for objects partially matching the interface', () => {
            assert.deepStrictEqual(is<Foo<number>>({ a: 0, b: '' }), false);
            assert.deepStrictEqual(is<Foo<number>>({ a: 1, b: 'a' }), false);
        });
    });

    describe('is<IndexedNested>', () => {
        interface Nested {
            foo: string;
        }

        interface IndexedNested {
            [Key: string]: Nested;
        }

        it('should return true for objects matching the indexed nested interface', () => {
            assert.deepStrictEqual(is<IndexedNested>({}), true);
            assert.deepStrictEqual(is<IndexedNested>({ a: { foo: 'a' } }), true);
            assert.deepStrictEqual(is<IndexedNested>({ b: { foo: 'b' } }), true);
            assert.deepStrictEqual(is<IndexedNested>({ a: { foo: 'a' }, b: { foo: 'b' } }), true);
        });

        it('should return false for non-object literals', () => {
            assert.deepStrictEqual(is<IndexedNested>(null), false);
            assert.deepStrictEqual(is<IndexedNested>(undefined), false);
            assert.deepStrictEqual(is<IndexedNested>(0), false);
            assert.deepStrictEqual(is<IndexedNested>(1), false);
            assert.deepStrictEqual(is<IndexedNested>(''), false);
            assert.deepStrictEqual(is<IndexedNested>('a'), false);
            assert.deepStrictEqual(is<IndexedNested>(true), false);
            assert.deepStrictEqual(is<IndexedNested>(false), false);
        });

        it('should return false for objects not matching the indexed nested interface', () => {
            assert.deepStrictEqual(is<IndexedNested>({ a: true }), false);
            assert.deepStrictEqual(is<IndexedNested>({ b: false }), false);
            assert.deepStrictEqual(is<IndexedNested>({ a: {} }), false);
            assert.deepStrictEqual(is<IndexedNested>({ b: [] }), false);
            assert.deepStrictEqual(is<IndexedNested>({ c: '' }), false);
            assert.deepStrictEqual(is<IndexedNested>({ d: 'a' }), false);
            assert.deepStrictEqual(is<IndexedNested>({ a: { foo: 0 } }), false);
            assert.deepStrictEqual(is<IndexedNested>({ a: { foo: 1 } }), false);
            assert.deepStrictEqual(is<IndexedNested>({ a: { foo: true } }), false);
            assert.deepStrictEqual(is<IndexedNested>({ a: { foo: false } }), false);
        });

        it('should return false for objects partially matching the indexed nested interface', () => {
            assert.deepStrictEqual(is<IndexedNested>({ a: { foo: 'a' }, b: {} }), false);
            assert.deepStrictEqual(is<IndexedNested>({ a: { foo: 'a' }, b: { foo: 0 } }), false);
        });
    });
});
