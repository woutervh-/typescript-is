let defaultGetErrorObject = undefined;

function checkGetErrorObject(getErrorObject) {
    if (typeof getErrorObject !== 'function') {
        throw new Error('This module should not be used in runtime. Instead, use a transformer during compilation.');
    }
}

const assertionsMetadataKey = Symbol('assertions');

function inputObjectAtPath(path, inputObject) {
    let subField = inputObject;
    for (const key of path.slice(1)) {
        subField = subField[
            key.startsWith("[") ? parseInt(key.replace("[", "").replace("]", "")) : key
        ];
    }
    return subField;
}

function appendInputToErrorMessage(message, path, inputObject) {
    if (message === undefined)
        return 'validation error';
    const foundInputObject = inputObjectAtPath(path, inputObject);
    try {
        return message + ', found: ' + require('util').inspect(foundInputObject);
    } catch (error) {
    }
    try {
        return message + ', found: ' + JSON.stringify(foundInputObject);
    } catch (error) {
    }
    return message;
}

class TypeGuardError extends Error {
    constructor(errorObject, inputObject) {
        super(appendInputToErrorMessage(errorObject.message, errorObject.path, inputObject));
        this.name = 'TypeGuardError';
        this.path = errorObject.path;
        this.reason = errorObject.reason;
        this.input = inputObject;
    }
}

function AssertType(assertion, options = {}) {
    require('reflect-metadata');
    return function (target, propertyKey, parameterIndex) {
        const assertions = Reflect.getOwnMetadata(assertionsMetadataKey, target, propertyKey) || [];
        if(Reflect.getOwnMetadata('design:returntype', target, propertyKey) === Promise) {
            assertions[parameterIndex] = { assertion, options: Object.assign({ async: true }, options) };
        } else {
            assertions[parameterIndex] = { assertion, options };
        }
        Reflect.defineMetadata(assertionsMetadataKey, assertions, target, propertyKey);
    };
}

function ValidateClass(errorConstructor = TypeGuardError) {
    require('reflect-metadata');
    return function (target) {
        for (const propertyKey of Object.getOwnPropertyNames(target.prototype)) {
            const assertions = Reflect.getOwnMetadata(assertionsMetadataKey, target.prototype, propertyKey);
            if (assertions) {
                const originalMethod = target.prototype[propertyKey];
                target.prototype[propertyKey] = function (...args) {
                    for (let i = 0; i < assertions.length; i++) {
                        if (!assertions[i]) {
                            continue;
                        }
                        const errorObject = assertions[i].assertion(args[i]);
                        if (errorObject !== null) {
                            const errorInstance = new errorConstructor(errorObject, args[i]);
                            if(assertions[i].options.async) {
                                return Promise.reject(errorInstance);
                            } else {
                                throw errorInstance;
                            }
                        }
                    }
                    return originalMethod.apply(this, args);
                };
            }
        }
    };
}

function is(obj, getErrorObject = defaultGetErrorObject) {
    checkGetErrorObject(getErrorObject);
    const errorObject = getErrorObject(obj);
    return errorObject === null;
}

function assertType(obj, getErrorObject = defaultGetErrorObject) {
    checkGetErrorObject(getErrorObject);
    const errorObject = getErrorObject(obj);
    if (errorObject === null) {
        return obj;
    } else {
        throw new TypeGuardError(errorObject, obj);
    }
}

function createIs(getErrorObject = defaultGetErrorObject) {
    checkGetErrorObject(getErrorObject);
    return (obj) => is(obj, getErrorObject);
}

function createAssertType(getErrorObject = defaultGetErrorObject) {
    checkGetErrorObject(getErrorObject);
    return (obj) => assertType(obj, getErrorObject);
}

function setDefaultGetErrorObject(getErrorObject) {
    defaultGetErrorObject = getErrorObject;
}

module.exports = {
    is,
    assertType,
    createIs,
    createAssertType,
    equals: is,
    createEquals: createIs,
    assertEquals: assertType,
    createAssertEquals: createAssertType,
    AssertType,
    ValidateClass,
    TypeGuardError,
    setDefaultGetErrorObject
};
