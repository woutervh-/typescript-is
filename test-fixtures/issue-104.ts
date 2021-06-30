import {AssertType, ValidateClass} from '../index';

@ValidateClass()
export class AsyncMethods {
    async asyncMethod(@AssertType() body: { test: string }): Promise<boolean> {
        return true
    }
    async asyncMethodNoExplicitReturn(@AssertType() body: { test: string }) {
        return true
    }
    promiseReturnMethod(@AssertType() body: { test: string }): Promise<boolean> {
        return Promise.resolve(true)
    }
    async asyncOverride(@AssertType({ async: false }) body: { test: string }): Promise<boolean> {
        return true
    }
    promiseOrOtherReturnMethod(@AssertType() body: { test: string }): Promise<boolean> | boolean{
        return Promise.resolve(true)
    }
}

