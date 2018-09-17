import * as assert from 'assert';
import { is } from '../index';

/**
 * Tests interface, boolean, string, number, heritage clauses, interface members.
 */

interface Bar<V> {
    item: V;
}

interface Baz<W> {
    buz: W;
}

interface Foo<T, U> extends Bar<U>, Baz<number> {
    type: 'cool';
    secondItem: T;
    thirdItem: Bar<Bar<boolean>>;
}

const isNumber = (object: any): object is number => is<number>(object);

assert.strictEqual(isNumber(0), true);
assert.strictEqual(isNumber(1), true);
assert.strictEqual(isNumber(42), true);
assert.strictEqual(isNumber(-1), true);
assert.strictEqual(isNumber('0'), false);
assert.strictEqual(isNumber('1'), false);
assert.strictEqual(isNumber('42'), false);
assert.strictEqual(isNumber('-1'), false);
assert.strictEqual(is<Foo<Bar<number>, string>>({}), false);
assert.strictEqual(is<Foo<Bar<number>, string>>({ type: {}, secondItem: {}, thirdItem: {} }), false);
assert.strictEqual(is<Foo<Bar<number>, string>>({ item: 'string', buz: 1, type: 'cool', secondItem: { item: 2 }, thirdItem: { item: { item: true } } }), true);
assert.strictEqual(is<Foo<Bar<number>, string>>({ item: 'text', buz: 2, type: 'cool', secondItem: { item: 3 }, thirdItem: { item: { item: false } } }), true);
assert.strictEqual(is<boolean>(0), false);
assert.strictEqual(is<boolean>(1), false);
assert.strictEqual(is<boolean>('true'), false);
assert.strictEqual(is<boolean>('false'), false);
assert.strictEqual(is<boolean>(true), true);
assert.strictEqual(is<boolean>(false), true);
