# typescript-is

TypeScript transformer that generates run-time type-checks.

[![npm](https://img.shields.io/npm/v/typescript-is.svg)](https://www.npmjs.com/package/typescript-is)
![node](https://img.shields.io/node/v/typescript-is.svg)
[![Travis (.org)](https://img.shields.io/travis/woutervh-/typescript-is.svg)](https://travis-ci.org/woutervh-/typescript-is)
[![npm](https://img.shields.io/npm/dm/typescript-is.svg)](https://www.npmjs.com/package/typescript-is)
[![David](https://img.shields.io/david/woutervh-/typescript-is.svg)](https://david-dm.org/woutervh-/typescript-is)
[![David](https://img.shields.io/david/dev/woutervh-/typescript-is.svg)](https://david-dm.org/woutervh-/typescript-is?type=dev)
![NpmLicense](https://img.shields.io/npm/l/typescript-is.svg)

# 💿 Installation

```bash
npm install --save typescript-is

# Ensure you have the required dependencies at compile time:
npm install --save-dev typescript

# If you want to use the decorators, ensure you have reflect-metadata in your dependencies:
npm install --save reflect-metadata
```

# 💼 Use cases

If you've worked with [TypeScript](https://github.com/Microsoft/TypeScript) for a while, you know that sometimes you obtain `any` or `unknown` data that is not type-safe.
You'd then have to write your own function with **type predicates** that checks the foreign object, and makes sure it is the type that you need.

**This library automates writing the type predicate function for you.**

At compile time, it inspects the type you want to have checked, and generates a function that can check the type of a wild object at run-time.
When the function is invoked, it checks in detail if the given wild object complies with your favorite type.

In particular, you may obtain wild, untyped object, in the following situations:

* You're doing a `fetch` call, which returns some JSON object.
You don't know if the JSON object is of the shape you expect.
* Your users are uploading a file, which is then read by your application and converted to an object.
You don't know if this object is really the type you expect.
* You're reading a JSON string from `localStorage` that you've stored earlier.
Perhaps in the meantime the string has been manipulated and is no longer giving you the object you expect.
* Any other case where you lose compile time type information...

In these situations `typescript-is` can come to your rescue.

*NOTE* this package aims to generate type predicates for any *serializable* JavaScript object.
Please check [What it won't do](#-what-it-wont-do) for details.

### Similar projects

* [io-ts-transformer](https://github.com/awerlogus/io-ts-transformer)
* [io-ts](https://github.com/gcanti/io-ts)
* [ts-auto-guard](https://github.com/usabilityhub/ts-auto-guard)

# 🎛️ Configuration

This package exposes a TypeScript transformer factory at `typescript-is/lib/transformer-inline/transformer`

As there currently is no way to configure the TypeScript compiler to use a transformer without using it programatically, **the recommended way** is to compile with [ttypescript](https://github.com/cevek/ttypescript).
This is basically a wrapper around the TypeScript compiler that injects transformers configured in your `tsconfig.json`.

(please vote here to support transformers out-of-the-box: https://github.com/Microsoft/TypeScript/issues/14419)

## Using ttypescript

First install `ttypescript`:

```bash
npm install --save-dev ttypescript
```

Then make sure your `tsconfig.json` is configured to use the `typescript-is` transformer:

```json
{
    "compilerOptions": {
        "plugins": [
            { "transform": "typescript-is/lib/transform-inline/transformer" }
        ]
    }
}
```

Now compile using `ttypescript`:

```bash
npx ttsc
```

### Using with `ts-node`, `webpack`, `Rollup`

Please check the README of [ttypescript](https://github.com/cevek/ttypescript/blob/master/README.md) for information on how to use it in combination with `ts-node`, `webpack`, and `Rollup`.

Note: This will not work if `ts-loader` is configured with `transpileOnly: true`.

## Using with `webpack + ts-loader` without `ttypescript`

If you are using `ts-loader` in a `webpack` project, you can use [getCustomTransformers](https://github.com/TypeStrong/ts-loader#getcustomtransformers) as suggested in #54.
This means you don't need to use `ttypescript` or write a custom compilation script.

Example:

```javascript
const typescriptIsTransformer = require('typescript-is/lib/transform-inline/transformer').default

module.exports = {
    // I am hiding the rest of the webpack config
    module: {
        rules: [
            {
                test: /\.ts$/,
                exclude: /node_modules/,
                loader: 'ts-loader',
                options: {
                    getCustomTransformers: program => ({
                        before: [typescriptIsTransformer(program)]
                    })
                }
            }
        ]
    }
};
```

Note: This will not work if `ts-loader` is configured with `transpileOnly: true`.

## Options

There are some options to configure the transformer.

| Property | Description |
|--|--|
| `shortCircuit` | Boolean (default `false`). If `true`, all type guards will return `true`, i.e. no validation takes place. Can be used for example in production deployments where doing a lot of validation can cost too much CPU. |
| `ignoreClasses` | Boolean (default: `false`). If `true`, when the transformer encounters a class (except for `Date`), it will ignore it and simply return `true`. If `false`, an error is generated at compile time. |
| `ignoreMethods` | Boolean (default: `false`). If `true`, when the transformer encounters a method, it will ignore it and simply return `true`. If `false`, an error is generated at compile time. |
| `ignoreFunctions` *(deprecated, use `functionBehavior` instead)* | Boolean (default: `false`). If `true`, when the transformer encounters a function, it will ignore it and simply return `true`. If `false`, an error is generated at compile time. |
| `functionBehavior` | One of `error`, `ignore`, or `basic` (default: `error`). Determines the behavior of transformer when encountering a function. `error` will cause a compile-time error, `ignore` will cause the validation function to always return `true`, and `basic` will do a simple function-type-check. Overrides `ignoreFunctions`. |
| `disallowSuperfluousObjectProperties` | Boolean (default: `false`). If `true`, objects are checked for having superfluous properties and will cause the validation to fail if they do. If `false`, no check for superfluous properties is made. |
| `transformNonNullExpressions` | Boolean (default: `false`). If `true`, non-null expressions (eg. `foo!.bar`) are checked to not be `null` or `undefined` |
| `emitDetailedErrors` | Boolean or `auto` (default: `auto`). The generated validation functions can return detailed error messages, pointing out where and why validation failed. These messages are used by `assertType<T>()`, but are ignored by `is<T>()`. If `false`, validation functions return empty error messages, decreasing code size. `auto` will generate detailed error messages for assertions, but not for type checks. `true` will always generate detailed error messages, matching the behaviour of version 0.18.3 and older. |

If you are using `ttypescript`, you can include the options in your `tsconfig.json`:

```json
{
    "compilerOptions": {
        "plugins": [
            {
                "transform": "typescript-is/lib/transform-inline/transformer",
                "shortCircuit": true,
                "ignoreClasses": true,
                "ignoreMethods": true,
                "functionBehavior": "ignore",
                "disallowSuperfluousObjectProperties": true,
                "transformNonNullExpressions": true,
                "emitDetailedErrors": "auto"
            }
        ]
    }
}
```

# ⭐ How to use

*Before using, please make sure you've completed [configuring](#%EF%B8%8F-configuration) the transformer.*

In your TypeScript code, you can now import and use the type-check function `is` (or `createIs`), or the type assertion function `assertType` (or `createAssertType`).

## Validation (`is` and `createIs`)

For example, you can check if something is a `string` or `number` and use it as such, without the compiler complaining:

```typescript
import { is } from 'typescript-is';

const wildString: any = 'a string, but nobody knows at compile time, because it is cast to `any`';

if (is<string>(wildString)) { // returns true
    // wildString can be used as string!
} else {
    // never gets to this branch
}

if (is<number>(wildString)) { // returns false
    // never gets to this branch
} else {
    // Now you know that wildString is not a number!
}
```

You can also check your own interfaces:

```typescript
import { is } from 'typescript-is';

interface MyInterface {
    someObject: string;
    without: string;
}

const foreignObject: any = { someObject: 'obtained from the wild', without: 'type safety' };

if (is<MyInterface>(foreignObject)) { // returns true
    const someObject = foreignObject.someObject; // type: string
    const without = foreignObject.without; // type: string
}
```

## Assertions (`assertType` and `createAssertType`)

Or use the `assertType` function to directly use the object:

```typescript
import { assertType } from 'typescript-is';

const object: any = 42;
assertType<number>(object).toFixed(2); // "42.00"

try {
    const asString = assertType<string>(object); // throws error: object is not a string
    asString.toUpperCasse(); // never gets here
} catch (error) {
    // ...
}
```

## Decorators (`ValidateClass` and `AssertType`)

You can also use the **decorators** to automate validation in class methods.
To enable this functionality, you should make sure that experimental decorators are enabled for your TypeScript project.

```json
{
    "compilerOptions": {
        "experimentalDecorators": true
    }
}
```

You should also make sure the peer dependency **reflect-metadata** is installed.

```bash
npm install --save reflect-metadata
```

You can then use the decorators:

```typescript
import { ValidateClass, AssertType } from 'typescript-is';

@ValidateClass()
class A {
    method(@AssertType() value: number) {
        // You can safely use value as a number
        return value;
    }
}

new A().method(42) === 42; // true
new A().method('42' as any); // will throw error
```

### async and `Promise` returning methods 
`AssertType` can also work correctly with `async` methods, returning promise rejected with `TypeGuardError`

To enable this functionality, you need to emit decorators metadata for your TypeScript project.

```json
{
    "compilerOptions": {
      "emitDecoratorMetadata": true
    }
}
```

Then `AssertType` will work with async methods and `Promise` returning methods automatically.
```typescript
import { ValidateClass, AssertType } from 'typescript-is';

@ValidateClass()
class A {
    async method(@AssertType({ async: true }) value: number) {
        // You can safely use value as a number
        return value;
    }

    methodPromise(@AssertType({ async: true }) value: number): Promise<number> {
        // You can safely use value as a number
        return Promise.resolve(value);
    }
}

new A().method(42).then(value => value === 42 /* true */); 
new A().method('42' as any).catch(error => {
    // error will be of TypeGuardError type
})
new A().methodPromise('42' as any).catch(error => {
    // error will be of TypeGuardError type
})
```

If you want to throw synchronously for some reason, you can override the behaviour using with `@AssertType({ async: false })`:
```typescript
import { ValidateClass, AssertType } from 'typescript-is';

@ValidateClass()
class A {
    async method(@AssertType({ async: false }) value: number) {
        // You can safely use value as a number
        return value;
    }
}

new A().method(42).then(value => value === 42 /* true */);
new A().method('42' as any); // will throw error
```

If you cannot or don't want to enable decorators metadata, you still make AssertType reject with promise using `@AssertType({ async: true })` 
```typescript
import { ValidateClass, AssertType } from 'typescript-is';

@ValidateClass()
class A {
    async method(@AssertType({ async: true }) value: number) {
        // You can safely use value as a number
        return value;
    }
}
```

## Strict equality (`equals`, `createEquals`, `assertEquals`, `createAssertEquals`)

This family of functions check not only whether the passed object is assignable to the specified type, but also checks that the passed object does not contain any more than is necessary. In other words: the type is also "assignable" to the object. This functionality is equivalent to specifying `disallowSuperfluousObjectProperties` in the options, the difference is that this will apply only to the specific function call. For example:

```typescript
import { equals } from 'typescript-is';

interface X {
    x: string;
}

equals<X>({}); // false, because `x` is missing
equals<X>({ x: 'value' }); // true
equals<X>({ x: 'value', y: 'another value' }); // false, because `y` is superfluous
```

To see the declarations of the functions and more examples, please check out [index.d.ts](https://github.com/woutervh-/typescript-is/blob/master/index.d.ts).

For **many more examples**, please check out the files in the [test/](https://github.com/woutervh-/typescript-is/tree/master/test) folder.
There you can find all the different types that are tested for.

# ⛔ What it won't do

* This library aims to be able to check any serializable data.
* This library will not check functions. Function signatures are impossible to check at run-time.
* This library will not check classes (except the global `Date`). Instead, you are encouraged to use the native `instanceof` operator. For example:

```typescript
import { is } from 'typescript-is';

class MyClass {
    // ...
}

const instance: any = new MyClass();
is<MyClass>(instance); // error -> classes are not supported.

// Instead, use instanceof:
if (instance instanceof MyClass) {
    // ...
}
```

* This library will not magically check unbound type parameters. Instead, make sure all type parameters are bound to a well-defined type when invoking the `is` function. For example:

```typescript
import { is } from 'typescript-is';

function magicalTypeChecker<T>(object: any): object is T {
    return is<T>(object); // error -> type `T` is not bound.
}
```

If you stumble upon anything else that is not yet supported, please open an issue or submit a PR. 😉

# 🗺️ Road map

Features that are planned:

* Promise support. Something like `assertOrReject<Type>(object)` will either `resolve(object)` or `reject(error)`.
* Optimize the generated conditions. Things like `false || "key" === "key"` can be simplified. Might be more interesting to publish a different library that can transform a TypeScript AST, and then use it here, or use an existing one. Might be out of scope, as there are plenty of minifiers/uglifiers/manglers out there already.

# 🔨 Building and testing

```bash
git clone https://github.com/woutervh-/typescript-is.git
cd typescript-is/
npm install

# Building
npm run build

# Testing
npm run test
```
