import { createAssertType, TypeGuardError } from '../index';
import * as assert from 'assert';

/* https://github.com/woutervh-/typescript-is/issues/56 */

type NullableUnion = null | string;
type NestedNullableUnion = {a: null | {b: null | {c: null | string}}};
type SimpleUnion = null | string | boolean;

describe('is', () => {
  describe('createAssertType<null | string>', () => {
    it('Should work if null is passed', () => {
      createAssertType<NullableUnion>()(null);
    })
    it('Should work if string is passed', () => {
      createAssertType<NullableUnion>()('string')
    })
    it('Should throw an error if number is passed', () => {
      try {
        createAssertType<NullableUnion>()(42);
      } catch (error) {
        assert.deepStrictEqual(error instanceof TypeGuardError, true);
        assert.deepStrictEqual(error.message, 'validation failed at $: expected a string, found: 42');
        assert.deepStrictEqual(error.path, ['$']);
        assert.deepStrictEqual(error.reason, { type: 'string' });
      }
    });
  });

  describe('createAssertType<{a: null | {b: null | {c: null | string}}}>', () => {
    it('Should work', () => {
      createAssertType<NestedNullableUnion>()({a: null});
      createAssertType<NestedNullableUnion>()({a: {b: null}});
      createAssertType<NestedNullableUnion>()({a: {b: {c: null}}});
      createAssertType<NestedNullableUnion>()({a: {b: {c: 'string'}}});
    })
    it('Should throw an error if number is passed instead of string', () => {
      try {
        createAssertType<NestedNullableUnion>()({a: {b: {c: 42}}});
      } catch (error) {
        assert.deepStrictEqual(error instanceof TypeGuardError, true);
        assert.deepStrictEqual(error.message, 'validation failed at $.a.b.c: expected a string, found: 42');
        assert.deepStrictEqual(error.path, ['$', 'a', 'b', 'c']);
        assert.deepStrictEqual(error.reason, { type: 'string' });
      }
    });
    it('Should throw an error if number is passed instead of object', () => {
      try {
        createAssertType<NestedNullableUnion>()({a: {b: 42}});
      } catch (error) {
        assert.deepStrictEqual(error instanceof TypeGuardError, true);
        assert.deepStrictEqual(error.message, 'validation failed at $.a.b: expected an object, found: 42');
        assert.deepStrictEqual(error.path, ['$', 'a', 'b']);
        assert.deepStrictEqual(error.reason, { type: 'object' });
      }
    });
  });
  describe('createAssertType<string | boolean | null>', () => {
    it('Should work', () => {
      createAssertType<SimpleUnion>()(null);
      createAssertType<SimpleUnion>()('string');
      createAssertType<SimpleUnion>()(false);
    })
    it('Should throw an error if object is provided', () => {
      try {
        createAssertType<SimpleUnion>()({});
      } catch (error) {
        assert.deepStrictEqual(error instanceof TypeGuardError, true);
        assert.deepStrictEqual(error.message, 'validation failed at $: there are no valid alternatives, found: {}');
        assert.deepStrictEqual(error.path, ['$']);
        assert.deepStrictEqual(error.reason, { type: 'union' });
      }
    });
  });
});
