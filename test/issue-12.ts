import * as assert from 'assert';
import { is } from '../index';

/* https://github.com/woutervh-/typescript-is/issues/12 */

describe('is', () => {
    interface ConfigInit {
        folder: string;
        children: ConfigInit[];
    }

    describe('is<ConfigInit>', () => {
        it('should return true for valid recursive ConfigInit objects', () => {
            assert.strictEqual(is<ConfigInit>({ folder: '.', children: [] }), true);
            assert.strictEqual(is<ConfigInit>({ folder: '.', children: [{ folder: './foo', children: [] }] }), true);
            assert.strictEqual(is<ConfigInit>({ folder: '.', children: [{ folder: './foo', children: [{ folder: './foo/bar', children: [] }] }] }), true);
            assert.strictEqual(is<ConfigInit>({ folder: '.', children: [{ folder: './foo', children: [] }, { folder: './baz', children: [] }] }), true);
        });
    });
});
