import { is } from '../index';

interface WithMethod {
    method();
}

is<WithMethod>({}); // ignore when ignoreMethods is true
