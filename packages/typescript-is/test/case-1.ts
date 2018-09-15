import * as assert from 'assert';
import { is } from '../index';

interface Bar<V> /*extends Pick<number, keyof number>*/ {
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

assert.strictEqual(is<Foo<Bar<number>, string>>({}), false);
assert.strictEqual(is<Foo<Bar<number>, string>>({ item: 'string', buz: 1, type: 'cool', secondItem: { item: 2 }, thirdItem: { item: { item: true } } }), true);
assert.strictEqual(is<boolean>('true'), false);
assert.strictEqual(is<boolean>(false), true);
