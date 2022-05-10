/* tslint:disable:max-classes-per-file */

import * as assert from 'assert';
import { AssertType, ValidateClass } from '../index';

/* https://github.com/woutervh-/typescript-is/issues/129 */

describe('AssertType', () => {
    const expectedMessageRegExp = /Custom error.$/;

    class CustomError extends Error {
        constructor() {
            super('Custom error.');
        }
    }

    @ValidateClass()
    class TestClass {
        testMethod(@AssertType({errorConstructor: CustomError}) parameter: boolean) {
            return parameter;
        }
    }
    const instance = new TestClass();

    it('should allow custom error class', () => {
        assert.throws(() => instance.testMethod(0 as any), expectedMessageRegExp);
        assert.throws(() => instance.testMethod(1 as any), expectedMessageRegExp);
        assert.throws(() => instance.testMethod('' as any), expectedMessageRegExp);
        assert.throws(() => instance.testMethod('true' as any), expectedMessageRegExp);
        assert.throws(() => instance.testMethod({} as any), expectedMessageRegExp);
        assert.throws(() => instance.testMethod([] as any), expectedMessageRegExp);
    });
});
