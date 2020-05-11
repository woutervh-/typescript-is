import { is } from '../index';

// overwriting the global Date with a custom class, this isn't supported and should raise an error if ignoreClasses is false
class Date {}

is<Date>(new Date()); // ignore when ignoreClasses is true
