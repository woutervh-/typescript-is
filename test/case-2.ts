import * as assert from 'assert';
import { is } from '../index';

/**
 * 
 */

type Foo<T> = Pick<T, keyof T>;

assert.strictEqual(is<Foo<{ member: boolean }>>({ member: true }), true);
