import * as assert from 'assert';
import { is } from '../index';

declare function BigInt(value: any): bigint;

describe('is', () => {
    const isBigIntSupported = !!(global as any).BigInt;

    // check if bigint is supported for the old nodejs versions
    if (isBigIntSupported) {
        describe('is<bigint>', () => {
            it('should always return false for non bigint', () => {
                assert.strictEqual(is<bigint>(0), false);
                assert.strictEqual(is<bigint>(1), false);
                assert.strictEqual(is<bigint>(true), false);
                assert.strictEqual(is<bigint>(false), false);
                assert.strictEqual(is<bigint>(''), false);
                assert.strictEqual(is<bigint>('a'), false);
                assert.strictEqual(is<bigint>({}), false);
                assert.strictEqual(is<bigint>([]), false);
                assert.strictEqual(is<bigint>(null), false);
                assert.strictEqual(is<bigint>(undefined), false);
            });

            it('should always return true for bigint', () => {
                assert.strictEqual(is<bigint>(BigInt(1)), true);
            });
        });

        describe('is<Bar<bigint>>', () => {
            interface Bar<V> {
                item: V;
            }

            it('should always return false for non bigint in Bar property', () => {
                assert.strictEqual(is<Bar<bigint>>({item: 1}), false);
            });

            it('should always return true for bigint in Bar property', () => {
                assert.strictEqual(is<Bar<bigint>>({item: BigInt(1)}), true);
            });
        });
    }
});
