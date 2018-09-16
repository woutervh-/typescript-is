import * as assert from 'assert';
import { is } from '../index';

/**
 * 
 */

type Foo<T> = Pick<T, keyof T>;

assert.strictEqual(is<Foo<{ field: boolean }>>({ field: true }), true);
