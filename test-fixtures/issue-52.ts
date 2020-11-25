import { is } from '../index';

type F = () => void;

is<F>(() => { });
