import { is } from 'typescript-is';

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

is<Foo<Bar<number>, string>>({});
// is<boolean>({});
