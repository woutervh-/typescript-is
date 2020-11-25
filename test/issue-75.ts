/* tslint:disable:max-classes-per-file */

import * as assert from 'assert';
import { AssertType, ValidateClass } from '../index';

/* https://github.com/woutervh-/typescript-is/issues/75 */

describe('@ValidateClass, @AssertType', () => {
    describe('@ValidateClass(), @AssertType() skipping first parameter', () => {
        @ValidateClass()
        class TestClass {
            testMethod(first: string, @AssertType() second: number) {
                // No op.
            }
        }
        const instance = new TestClass();

        it('should pass validation for as long as the second parameter is a number', () => {
            instance.testMethod('foo', 0);
            instance.testMethod('foo', 1);
            instance.testMethod('foo', Number.NaN);
            instance.testMethod(false as any, 0);
            instance.testMethod(false as any, 1);
            instance.testMethod(false as any, Number.NaN);
        });

        it('should throw an error for non-numbers passed to the second parameter', () => {
            const expectedMessageRegExp = /validation failed at second: expected a number, found: .*$/;
            assert.throws(() => instance.testMethod('foo', '' as any), expectedMessageRegExp);
            assert.throws(() => instance.testMethod('foo', '0' as any), expectedMessageRegExp);
            assert.throws(() => instance.testMethod('foo', '1' as any), expectedMessageRegExp);
            assert.throws(() => instance.testMethod('foo', true as any), expectedMessageRegExp);
            assert.throws(() => instance.testMethod('foo', false as any), expectedMessageRegExp);
            assert.throws(() => instance.testMethod('foo', {} as any), expectedMessageRegExp);
            assert.throws(() => instance.testMethod('foo', [] as any), expectedMessageRegExp);
            assert.throws(() => instance.testMethod('foo', null as any), expectedMessageRegExp);
        });
    });
});
