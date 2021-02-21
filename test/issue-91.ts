import {is} from '../index';
import * as assert from 'assert';

it('template literal types', () => {
    assert(is<`foo${string}`>('foobar'))
})
