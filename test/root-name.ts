import * as assert from 'assert';
import { AssertType, assertType, ValidateClass } from '../index';

describe('is', () => {
    type Foo = {a: string};

    @ValidateClass()
    class TestClass {
        testIdentifier(@AssertType() fooParam: Foo) {
            return fooParam;
        }
        testExpression(@AssertType() {a}: Foo) {
            return a;
        }
    }

    describe('root name detection', () => {
        it('should default to "$"', () => {
            const testClass = new TestClass();
            assert.throws(() => assertType<Foo>([1, 'a']), /validation failed at \$/);
            assert.throws(() => testClass.testExpression(123 as any), /validation failed at \$/);
        });
        it('should pick up identifier name', () => {
            const testClass = new TestClass();
            const testVar = 123 as any;
            assert.throws(() => assertType<Foo>(testVar), /validation failed at testVar/);
            assert.throws(() => testClass.testIdentifier(123 as any), /validation failed at fooParam/);
        });
        it('should pick up undefined', () => {
            assert.throws(() => assertType<number>(undefined), /validation failed at undefined/);
        });
    });
});
