import * as assert from 'assert';
import { is } from '../../index';

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

assert.equal(is<Foo<Bar<number>, string>>({}), false);
