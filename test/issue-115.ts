import * as assert from 'assert';
import { is } from '../index';

/* https://github.com/woutervh-/typescript-is/issues/115 */

export const Status = {
    enable: 'enable',
    disable: 'disable'
} as const;

type StatusObject<Key extends keyof typeof Status> = {
    status: (typeof Status)[Key];
};

const testObj = {
    outer: 0
};

describe('is', () => {
    describe('Accessing generic member of a type', () => {
        it('should return true for the right member', () => {
            assert.deepStrictEqual(is<StatusObject<'enable'>>({ status: Status.enable }), true);
        });
        it('should return false for the wrong member', () => {
           assert.deepStrictEqual(is<StatusObject<'enable'>>({ status: Status.disable }), false);
        });
    });

    describe('Using typeof instead of a type', () => {
        it('should return true for the right member', () => {
            assert.deepStrictEqual(is<typeof testObj>('test'), false);
        });
        it('should return false for the wrong member', () => {
           assert.deepStrictEqual(is<typeof testObj>({ outer: 5 }), true);
        });
    });
});