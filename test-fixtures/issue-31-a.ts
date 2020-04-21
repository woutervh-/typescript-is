import { is } from '../index';

class Test {}

is<Test>(null); // ignore when ignoreClasses is true
