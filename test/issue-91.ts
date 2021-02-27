import {is} from '../index';
import * as assert from 'assert';

describe('template literal types', () => {
    describe('union types', () => {
        type Foo = `foo${'bar' | 'baz'}`
        it('true', () => assert(is<Foo>('foobar')))
        it('false', () => assert(!is<Foo>('barbaz')))
    })

    describe('primitives', () => {
        type Foo = `foo${string}bar${number}`
        it('true', () => assert(is<Foo>('foobazbar123')))
        it('false', () => assert(!is<Foo>('foobazbar123qux'))) // TODO: figure out why this one causes a stack overflow when using assertType
    })

    it('buncha stuff', () =>
        assert(is<`foo${string}${number}bar${1 | 2 | 3}baz${number}asdf`>('foobar1bar2baz123asdf'))
    )
})
