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

console.log(is<Foo<Bar<number>, string>>({}));
console.log(is<Foo<Bar<number>, string>>({ item: 'string', buz: 1, type: 'cool', secondItem: { item: 2 }, thirdItem: { item: { item: true } } }));
console.log(is<boolean>(true));
console.log(is<boolean>(false));
