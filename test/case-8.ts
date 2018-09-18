import * as assert from 'assert';
import { is } from '../index';

describe('is', () => {
    describe('is<null>', () => {
        it('should return true for the literal null', () => {
            assert.strictEqual(is<null>(null), true);
        });

        it('should return false for other objects', () => {
            assert.strictEqual(is<null>(undefined), false);
            assert.strictEqual(is<null>(true), false);
            assert.strictEqual(is<null>(1), false);
            assert.strictEqual(is<null>(''), false);
            assert.strictEqual(is<null>({}), false);
            assert.strictEqual(is<null>([]), false);
        });
    });

    describe('is<undefined>', () => {
        it('should return true for the literal undefined', () => {
            assert.strictEqual(is<undefined>(undefined), true);
        });

        it('should return false for other objects', () => {
            assert.strictEqual(is<undefined>(null), false);
            assert.strictEqual(is<undefined>(true), false);
            assert.strictEqual(is<undefined>(1), false);
            assert.strictEqual(is<undefined>(''), false);
            assert.strictEqual(is<undefined>({}), false);
            assert.strictEqual(is<undefined>([]), false);
        });
    });
});
