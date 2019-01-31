import { is } from '../index';

class ClassX {
    method() {
        //
    }
}

is<ClassX>(new ClassX()); // error: classes are not supported
