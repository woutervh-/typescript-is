// import * as assert from 'assert';
// import { is } from '../index';

// /* https://github.com/woutervh-/typescript-is/issues/49 */

// // NOTE: this test will only pass when and only when "strictNullChecks" is "false" in tsconfig-test.json

// describe('is', () => {
//     describe('is<string>', () => {
//         it('should return true for strings, null and undefined', () => {
//             assert.deepStrictEqual(is<string>('string'), true);
//             assert.deepStrictEqual(is<string>(null), true);
//             assert.deepStrictEqual(is<string>(undefined), true);
//         });

//         it('should return false for other objects', () => {
//             assert.deepStrictEqual(is<string>(0), false);
//             assert.deepStrictEqual(is<string>(true), false);
//             assert.deepStrictEqual(is<string>({}), false);
//             assert.deepStrictEqual(is<string>([]), false);
//         });
//     });
// });
