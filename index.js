require('reflect-metadata');

function warn() {
    throw new Error('This module should not be used in runtime. Instead, use a transformer during compilation.');
}

const assertionsMetadataKey = Symbol('assertions');

function AssertParameter(assertion, options = {}) {
    return function (target, propertyKey, parameterIndex) {
        const assertions = Reflect.getOwnMetadata(assertionsMetadataKey, target, propertyKey) || [];
        assertions[parameterIndex] = { assertion, options };
        Reflect.defineMetadata(assertionsMetadataKey, assertions, target, propertyKey);
    };
}

function ValidateClass(errorConstructor = Error) {
    return function (target) {
        for (const propertyKey of Object.getOwnPropertyNames(target.prototype)) {
            const assertions = Reflect.getOwnMetadata(assertionsMetadataKey, target.prototype, propertyKey);
            if (assertions) {
                const originalMethod = target.prototype[propertyKey];
                target.prototype[propertyKey] = function (...args) {
                    for (let i = 0; i < assertions.length; i++) {
                        if (!assertions[i].assertion(args[i])) {
                            throw new errorConstructor(assertions[i].options.message || 'Type assertion failed.');
                        }
                    }
                    return originalMethod.apply(this, args);
                };
            }
        }
    };
}

module.exports = { is: warn, assertType: warn, createIs: warn, createAssertType: warn, AssertParameter, ValidateClass };
