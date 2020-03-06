import { is } from '../index';

class MyClass {
    method(): string {
        return "";
    };
}

type MappedType = {
    [P in keyof MyClass]: MyClass[P];
}

const mappedType: MappedType = {
    method: () => ''
};

is<MappedType>(mappedType);

interface WithFunction {
    f: () => void;
}

is<WithFunction>({ f: () => { } });

is<() => void>(() => { });

