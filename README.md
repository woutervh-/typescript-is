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
npm install --save-dev typescript-is
```

# 💼 Use cases

If you've worked with [TypeScript](https://github.com/Microsoft/TypeScript) for a while, you know that sometimes you obtain data that is not type-safe.
You'd then have to write your own function with **type predicates** that checks the foreign object, and makes sure it is the type that you need.

**This library automates writing the type predicate function for you.**

At compile time, it inspects the type you want to have checked, and generates a function that can check the type of a wild object at run time.
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

# 🎛️ Configuration

This package exposes a TypeScript transformer factory at `typescript-is/lib/transformer-inline/transformer.ts`

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
            { "transform": "typescript-is/lib/transformer-inline/transformer.ts" },
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

# ⭐ How to use

In your TypeScript code, you can now import and use the type-check function.
For example, you can check if something is a `string` or `number` and use it as such, without the compiler complaining:

```typescript
import { is } from 'typescript-is';

const wildString: any = 'a string, but nobody knows at compile time, because it is cast to `any`';

if (is<string>(wildString)) {
    // wildString can be used as string!
} else {
    // Should never happen...
}

if (is<number>(wildString)) {
    // Should never happen...
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

if (is<MyInterface>(foreignObject)) {
    // Call expression returns true
    const someObject = foreignObject.someObject; // type: string
    const without = foreignObject.without; // type: string
}
```

For a lot **more examples**, please check out the files in the [test/](https://github.com/woutervh-/typescript-is/tree/master/test) folder.
There you can find all the different types that are tested for.

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
