import { is } from '../index';

interface WithLambda {
    testA(): void;
    nested: {
        testB(value: string): string
    };
}

is<WithLambda>({ convert: 'ignored' }); // ignore when ignoreMethods is true
