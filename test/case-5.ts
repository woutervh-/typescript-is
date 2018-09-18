import * as assert from 'assert';
import { is } from '../index';

describe('is', () => {
    describe('is<Alias>', () => {
        type SubAlias = number;

        type Alias = SubAlias;

        it('should return true for numbers', () => {
            assert.strictEqual(is<Alias>(0), true);
            assert.strictEqual(is<Alias>(1), true);
            assert.strictEqual(is<Alias>(Number.NaN), true);
        });

        it('should return false for other literals', () => {
            assert.strictEqual(is<Alias>(null), false);
            assert.strictEqual(is<Alias>(undefined), false);
            assert.strictEqual(is<Alias>({}), false);
            assert.strictEqual(is<Alias>([]), false);
            assert.strictEqual(is<Alias>(true), false);
            assert.strictEqual(is<Alias>(false), false);
            assert.strictEqual(is<Alias>(''), false);
            assert.strictEqual(is<Alias>('a'), false);
        });
    });

    describe('is<Foo<number>>', () => {
        interface Baz<T> {
            [Key: string]: T;
        }

        interface Bar<T> extends Baz<T> { }

        interface Foo<T> extends Bar<T> { }

        it('should return true for objects matching the interface', () => {
            assert.strictEqual(is<Foo<number>>({}), true);
            assert.strictEqual(is<Foo<number>>({ a: 0, b: 1, c: -1, d: Number.NaN }), true);
            assert.strictEqual(is<Foo<number>>({ 'unicode 😊': Number.POSITIVE_INFINITY }), true);
        });

        it('should return false for non-object literals', () => {
            assert.strictEqual(is<Foo<number>>(null), false);
            assert.strictEqual(is<Foo<number>>(undefined), false);
            assert.strictEqual(is<Foo<number>>(0), false);
            assert.strictEqual(is<Foo<number>>(1), false);
            assert.strictEqual(is<Foo<number>>(''), false);
            assert.strictEqual(is<Foo<number>>('a'), false);
            assert.strictEqual(is<Foo<number>>(true), false);
            assert.strictEqual(is<Foo<number>>(false), false);
        });

        it('should return false for objects not matching the interface', () => {
            assert.strictEqual(is<Foo<number>>({ a: true }), false);
            assert.strictEqual(is<Foo<number>>({ b: false }), false);
            assert.strictEqual(is<Foo<number>>({ a: {} }), false);
            assert.strictEqual(is<Foo<number>>({ b: [] }), false);
            assert.strictEqual(is<Foo<number>>({ c: '' }), false);
            assert.strictEqual(is<Foo<number>>({ d: 'a' }), false);
        });

        it('should return false for objects partially matching the interface', () => {
            assert.strictEqual(is<Foo<number>>({ a: 0, b: '' }), false);
            assert.strictEqual(is<Foo<number>>({ a: 1, b: 'a' }), false);
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
            assert.strictEqual(is<IndexedNested>({}), true);
            assert.strictEqual(is<IndexedNested>({ a: { foo: 'a' } }), true);
            assert.strictEqual(is<IndexedNested>({ b: { foo: 'b' } }), true);
            assert.strictEqual(is<IndexedNested>({ a: { foo: 'a' }, b: { foo: 'b' } }), true);
        });

        it('should return false for non-object literals', () => {
            assert.strictEqual(is<IndexedNested>(null), false);
            assert.strictEqual(is<IndexedNested>(undefined), false);
            assert.strictEqual(is<IndexedNested>(0), false);
            assert.strictEqual(is<IndexedNested>(1), false);
            assert.strictEqual(is<IndexedNested>(''), false);
            assert.strictEqual(is<IndexedNested>('a'), false);
            assert.strictEqual(is<IndexedNested>(true), false);
            assert.strictEqual(is<IndexedNested>(false), false);
        });

        it('should return false for objects not matching the indexed nested interface', () => {
            assert.strictEqual(is<IndexedNested>({ a: true }), false);
            assert.strictEqual(is<IndexedNested>({ b: false }), false);
            assert.strictEqual(is<IndexedNested>({ a: {} }), false);
            assert.strictEqual(is<IndexedNested>({ b: [] }), false);
            assert.strictEqual(is<IndexedNested>({ c: '' }), false);
            assert.strictEqual(is<IndexedNested>({ d: 'a' }), false);
            assert.strictEqual(is<IndexedNested>({ a: { foo: 0 } }), false);
            assert.strictEqual(is<IndexedNested>({ a: { foo: 1 } }), false);
            assert.strictEqual(is<IndexedNested>({ a: { foo: true } }), false);
            assert.strictEqual(is<IndexedNested>({ a: { foo: false } }), false);
        });

        it('should return false for objects partially matching the indexed nested interface', () => {
            assert.strictEqual(is<IndexedNested>({ a: { foo: 'a' }, b: {} }), false);
            assert.strictEqual(is<IndexedNested>({ a: { foo: 'a' }, b: { foo: 0 } }), false);
        });
    });
});
