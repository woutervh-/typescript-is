import * as assert from 'assert';
import {AsyncMethods} from '../test-fixtures/issue-104';

describe('@ValidateClass(), @AssertType()', () => {
    it('should return rejected promise for async methods', () => {
        const instance = new AsyncMethods()
        assert.rejects(instance.asyncMethod({invalid: 123} as any))
    })
    it('should return rejected promise for async methods with not explicit return type', () => {
        const instance = new AsyncMethods()
        assert.rejects(instance.asyncMethodNoExplicitReturn({invalid: 123} as any))
    })
    it('should return rejected promise for methods returning promise', () => {
        const instance = new AsyncMethods()
        assert.rejects(instance.promiseReturnMethod({invalid: 123} as any))
    })
    it('should throw synchronously if { async: false } option is set', () => {
        const instance = new AsyncMethods()
        assert.throws(() => instance.asyncOverride({invalid: 123} as any))
    })
    it('should throw synchronously method may return something other than promise', () => {
        const instance = new AsyncMethods()
        assert.throws(() => instance.promiseOrOtherReturnMethod({invalid: 123} as any))
    })
})
