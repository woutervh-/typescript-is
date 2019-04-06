function checkGetErrorMessage(getErrorMessage) {
    if (typeof getErrorMessage !== 'function') {
        throw new Error('This module should not be used in runtime. Instead, use a transformer during compilation.');
    }
}

const assertionsMetadataKey = Symbol('assertions');

class TypeGuardError extends Error {
    constructor(...args) {
        super(...args);
        this.name = 'TypeGuardError';
    }
}

function AssertType(assertion, options = {}) {
    require('reflect-metadata');
    return function (target, propertyKey, parameterIndex) {
        const assertions = Reflect.getOwnMetadata(assertionsMetadataKey, target, propertyKey) || [];
        assertions[parameterIndex] = { assertion, options };
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
                        const errorMessage = assertions[i].assertion(args[i]);
                        if (errorMessage !== null) {
                            throw new errorConstructor(assertions[i].options.message || errorMessage);
                        }
                    }
                    return originalMethod.apply(this, args);
                };
            }
        }
    };
}

function is(obj, getErrorMessage) {
    checkGetErrorMessage(getErrorMessage);
    const errorMessage = getErrorMessage(obj);
    return errorMessage === null;
}

function assertType(obj, getErrorMessage) {
    checkGetErrorMessage(getErrorMessage);
    const errorMessage = getErrorMessage(obj);
    if (errorMessage === null) {
        return obj;
    } else {
        throw new TypeGuardError(errorMessage);
    }
}

function createIs(getErrorMessage) {
    checkGetErrorMessage(getErrorMessage);
    return (obj) => is(obj, getErrorMessage);
}

function createAssertType(getErrorMessage) {
    checkGetErrorMessage(getErrorMessage);
    return (obj) => assertType(obj, getErrorMessage);
}

module.exports = { is, assertType, createIs, createAssertType, AssertType, ValidateClass, TypeGuardError };
