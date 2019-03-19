import { is } from '../index';

class ClassX {
    method() {
        //
    }
}

is<ClassX>(new ClassX()); // ignore when ignoreClasses is true
