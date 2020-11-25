// import * as assert from 'assert';
// import { is } from '../index';

// // Related to issue-52
// // Note: these tests should only pass when the test is run with option: "functionBehavior": "basic"
// // Uncomment after changing the option to see if test passes.

// describe('is', () => {
//     type F = () => void;

//     describe('is<F>', () => {
//         it('should return true for any function', () => {
//             assert.deepStrictEqual(is<F>(() => undefined), true);
//             assert.deepStrictEqual(is<F>(() => 42), true);
//             assert.deepStrictEqual(is<F>(() => true), true);
//             assert.deepStrictEqual(is<F>(() => false), true);
//         });

//         it('should return false for any other type', () => {
//             assert.deepStrictEqual(is<F>({}), false);
//             assert.deepStrictEqual(is<F>([]), false);
//             assert.deepStrictEqual(is<F>(true), false);
//             assert.deepStrictEqual(is<F>(false), false);
//             assert.deepStrictEqual(is<F>(0), false);
//             assert.deepStrictEqual(is<F>(1), false);
//             assert.deepStrictEqual(is<F>(Number.NaN), false);
//             assert.deepStrictEqual(is<F>('string'), false);
//         });
//     });

//     type MyTypeFn = {
//         two: () => any;
//     };

//     describe('is<MyTypeFn>', () => {
//         it('should return true for an object with any function', () => {
//             assert.deepStrictEqual(is<MyTypeFn>({ two: () => undefined }), true);
//             assert.deepStrictEqual(is<MyTypeFn>({ two: () => 42 }), true);
//             assert.deepStrictEqual(is<MyTypeFn>({ two: () => true }), true);
//             assert.deepStrictEqual(is<MyTypeFn>({ two: () => false }), true);
//         });

//         it('should return false for an object with an non-function', () => {
//             assert.deepStrictEqual(is<MyTypeFn>({ two: {} }), false);
//             assert.deepStrictEqual(is<MyTypeFn>({ two: [] }), false);
//             assert.deepStrictEqual(is<MyTypeFn>({ two: true }), false);
//             assert.deepStrictEqual(is<MyTypeFn>({ two: false }), false);
//             assert.deepStrictEqual(is<MyTypeFn>({ two: 0 }), false);
//             assert.deepStrictEqual(is<MyTypeFn>({ two: 1 }), false);
//             assert.deepStrictEqual(is<MyTypeFn>({ two: Number.NaN }), false);
//             assert.deepStrictEqual(is<MyTypeFn>({ two: 'string' }), false);
//         });
//     });
// });
