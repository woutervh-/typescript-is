import * as assert from 'assert';
import { is } from '../index';

/**
 * Type alias, mapped types, object type literal.
 */

type Foo<T> = Pick<T, keyof T>;

assert.strictEqual(is<Foo<{ field: boolean }>>({ field: true }), true);
assert.strictEqual(is<Foo<{ field: boolean }>>({ field: false }), true);
assert.strictEqual(is<Foo<{ field: boolean }>>({ field: 0 }), false);
assert.strictEqual(is<Foo<{ field: boolean }>>({ field: 1 }), false);
