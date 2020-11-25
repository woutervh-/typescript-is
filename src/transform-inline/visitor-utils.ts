import * as ts from 'typescript';
import { ModifierFlags } from 'typescript';
import * as tsutils from 'tsutils/typeguard/3.0';
import { VisitorContext } from './visitor-context';
import { Reason } from '../../index';

export const objectIdentifier = ts.createIdentifier('object');
export const pathIdentifier = ts.createIdentifier('path');
const keyIdentifier = ts.createIdentifier('key');

export function checkIsClass(type: ts.ObjectType, visitorContext: VisitorContext) {
    // Hacky: using internal TypeScript API.
    if ('isArrayType' in visitorContext.checker && (visitorContext.checker as any).isArrayType(type)) {
        return false;
    }
    if ('isArrayLikeType' in visitorContext.checker && (visitorContext.checker as any).isArrayLikeType(type)) {
        return false;
    }

    let hasConstructSignatures = false;
    if (type.symbol !== undefined && type.symbol.valueDeclaration !== undefined && ts.isVariableDeclaration(type.symbol.valueDeclaration) && type.symbol.valueDeclaration.type) {
        const variableDeclarationType = visitorContext.checker.getTypeAtLocation(type.symbol.valueDeclaration.type);
        const constructSignatures = variableDeclarationType.getConstructSignatures();
        hasConstructSignatures = constructSignatures.length >= 1;
    }

    return type.isClass() || hasConstructSignatures;
}

export function checkIsDateClass(type: ts.ObjectType) {
    if (
        type.symbol !== undefined
        && type.symbol.escapedName === 'Date'
        && (ts.getCombinedModifierFlags(type.symbol.valueDeclaration) & ModifierFlags.Ambient) !== 0
    ) {
        return true;
    }
}

export function setFunctionIfNotExists(name: string, visitorContext: VisitorContext, factory: () => ts.FunctionDeclaration) {
    if (!visitorContext.functionNames.has(name)) {
        visitorContext.functionNames.add(name);
        visitorContext.functionMap.set(name, factory());
    }
    return name;
}

interface PropertyInfo {
    name: string;
    type: ts.Type | undefined; // undefined iff isMethod===true
    isMethod: boolean;
    isFunction: boolean;
    isSymbol: boolean;
    optional: boolean;
}

export function getPropertyInfo(parentType: ts.Type, symbol: ts.Symbol, visitorContext: VisitorContext): PropertyInfo {
    const name: string | undefined = symbol.name;
    if (name === undefined) {
        throw new Error('Missing name in property symbol.');
    }

    let propertyType: ts.Type | undefined = undefined;
    let isMethod: boolean | undefined = undefined;
    let isFunction: boolean | undefined = undefined;
    let optional: boolean | undefined = undefined;

    if ('valueDeclaration' in symbol) {
        // Attempt to get it from 'valueDeclaration'

        const valueDeclaration = symbol.valueDeclaration;
        if (!ts.isPropertySignature(valueDeclaration) && !ts.isMethodSignature(valueDeclaration)) {
            throw new Error('Unsupported declaration kind: ' + valueDeclaration.kind);
        }
        isMethod = ts.isMethodSignature(valueDeclaration);
        isFunction = valueDeclaration.type !== undefined && ts.isFunctionTypeNode(valueDeclaration.type);
        if (isMethod && !visitorContext.options.ignoreMethods) {
            throw new Error('Encountered a method declaration, but methods are not supported. Issue: https://github.com/woutervh-/typescript-is/issues/5');
        }
        if (isFunction && visitorContext.options.functionBehavior === 'error') {
            throw new Error('Encountered a function declaration, but functions are not supported. Issue: https://github.com/woutervh-/typescript-is/issues/50');
        }
        if (valueDeclaration.type === undefined) {
            if (!isMethod) {
                throw new Error('Found property without type.');
            }
        } else {
            propertyType = visitorContext.checker.getTypeFromTypeNode(valueDeclaration.type);
        }
        optional = !!valueDeclaration.questionToken;
    } else if ('type' in symbol) {
        // Attempt to get it from 'type'

        propertyType = (symbol as { type?: ts.Type }).type;
        isMethod = false;
        isFunction = false;
        optional = ((symbol as ts.Symbol).flags & ts.SymbolFlags.Optional) !== 0;
    } else if ('getTypeOfPropertyOfType' in visitorContext.checker) {
        // Attempt to get it from 'visitorContext.checker.getTypeOfPropertyOfType'

        propertyType = (visitorContext.checker as { getTypeOfPropertyOfType: (type: ts.Type, name: string) => ts.Type | undefined }).getTypeOfPropertyOfType(parentType, name);
        isMethod = false;
        isFunction = false;
        optional = ((symbol as ts.Symbol).flags & ts.SymbolFlags.Optional) !== 0;
    }

    if (optional !== undefined && isMethod !== undefined && isFunction !== undefined) {
        return {
            name,
            type: propertyType,
            isMethod,
            isFunction,
            isSymbol: name.startsWith('__@'),
            optional
        };
    }

    throw new Error('Expected a valueDeclaration or a property type.');
}

export function getTypeAliasMapping(type: ts.TypeReference) {
    const mapping: Map<ts.Type, ts.Type> = new Map();
    if (type.aliasTypeArguments !== undefined && type.target.aliasTypeArguments !== undefined) {
        const typeParameters = type.target.aliasTypeArguments;
        const typeArguments = type.aliasTypeArguments;
        for (let i = 0; i < typeParameters.length; i++) {
            if (typeParameters[i] !== typeArguments[i]) {
                mapping.set(typeParameters[i], typeArguments[i]);
            }
        }
    }
    return mapping;
}

export function getTypeReferenceMapping(type: ts.TypeReference, visitorContext: VisitorContext) {
    const mapping: Map<ts.Type, ts.Type> = new Map();
    (function checkBaseTypes(type: ts.TypeReference) {
        if (tsutils.isInterfaceType(type.target)) {
            const baseTypes = visitorContext.checker.getBaseTypes(type.target);
            for (const baseType of baseTypes) {
                if (tsutils.isTypeReference(baseType) && baseType.target.typeParameters !== undefined && baseType.typeArguments !== undefined) {
                    const typeParameters = baseType.target.typeParameters;
                    const typeArguments = baseType.typeArguments;
                    for (let i = 0; i < typeParameters.length; i++) {
                        if (typeParameters[i] !== typeArguments[i]) {
                            mapping.set(typeParameters[i], typeArguments[i]);
                        }
                    }
                    checkBaseTypes(baseType);
                }
            }
        }
    })(type);
    if (type.target.typeParameters !== undefined && type.typeArguments !== undefined) {
        const typeParameters = type.target.typeParameters;
        const typeArguments = type.typeArguments;
        for (let i = 0; i < typeParameters.length; i++) {
            if (typeParameters[i] !== typeArguments[i]) {
                mapping.set(typeParameters[i], typeArguments[i]);
            }
        }
    }
    return mapping;
}

export function getResolvedTypeParameter(type: ts.Type, visitorContext: VisitorContext) {
    let mappedType: ts.Type | undefined;
    for (let i = visitorContext.typeMapperStack.length - 1; i >= 0; i--) {
        mappedType = visitorContext.typeMapperStack[i].get(type);
        if (mappedType !== undefined) {
            break;
        }
    }
    return mappedType || type.getDefault();
}

export function getFunctionFunction(visitorContext: VisitorContext) {
    const name = '_function';
    return setFunctionIfNotExists(name, visitorContext, () => {
        return createAssertionFunction(
            ts.createStrictInequality(
                ts.createTypeOf(objectIdentifier),
                ts.createStringLiteral('function')
            ),
            { type: 'function' },
            name,
            createStrictNullCheckStatement(objectIdentifier, visitorContext)
        );
    });
}

export function getStringFunction(visitorContext: VisitorContext) {
    const name = '_string';
    return setFunctionIfNotExists(name, visitorContext, () => {
        return createAssertionFunction(
            ts.createStrictInequality(
                ts.createTypeOf(objectIdentifier),
                ts.createStringLiteral('string')
            ),
            { type: 'string' },
            name,
            createStrictNullCheckStatement(objectIdentifier, visitorContext)
        );
    });
}

export function getBooleanFunction(visitorContext: VisitorContext) {
    const name = '_boolean';
    return setFunctionIfNotExists(name, visitorContext, () => {
        return createAssertionFunction(
            ts.createStrictInequality(
                ts.createTypeOf(objectIdentifier),
                ts.createStringLiteral('boolean')
            ),
            { type: 'boolean' },
            name,
            createStrictNullCheckStatement(objectIdentifier, visitorContext)
        );
    });
}

export function getBigIntFunction(visitorContext: VisitorContext) {
    const name = '_bigint';
    return setFunctionIfNotExists(name, visitorContext, () => {
        return createAssertionFunction(
            ts.createStrictInequality(
                ts.createTypeOf(objectIdentifier),
                ts.createStringLiteral('bigint')
            ),
            { type: 'big-int' },
            name,
            createStrictNullCheckStatement(objectIdentifier, visitorContext)
        );
    });
}

export function getNumberFunction(visitorContext: VisitorContext) {
    const name = '_number';
    return setFunctionIfNotExists(name, visitorContext, () => {
        return createAssertionFunction(
            ts.createStrictInequality(
                ts.createTypeOf(objectIdentifier),
                ts.createStringLiteral('number')
            ),
            { type: 'number' },
            name,
            createStrictNullCheckStatement(objectIdentifier, visitorContext)
        );
    });
}

export function getUndefinedFunction(visitorContext: VisitorContext) {
    const name = '_undefined';
    return setFunctionIfNotExists(name, visitorContext, () => {
        return createAssertionFunction(
            ts.createStrictInequality(
                objectIdentifier,
                ts.createIdentifier('undefined')
            ),
            { type: 'undefined' },
            name,
            createStrictNullCheckStatement(objectIdentifier, visitorContext)
        );
    });
}

export function getNullFunction(visitorContext: VisitorContext) {
    const name = '_null';
    return setFunctionIfNotExists(name, visitorContext, () => {
        return createAssertionFunction(
            ts.createStrictInequality(
                objectIdentifier,
                ts.createNull()
            ),
            { type: 'null' },
            name,
            createStrictNullCheckStatement(objectIdentifier, visitorContext)
        );
    });
}

export function getNeverFunction(visitorContext: VisitorContext) {
    const name = '_never';
    return setFunctionIfNotExists(name, visitorContext, () => {
        return ts.createFunctionDeclaration(
            undefined,
            undefined,
            undefined,
            name,
            undefined,
            [
                ts.createParameter(undefined, undefined, undefined, objectIdentifier, undefined, undefined, undefined)
            ],
            undefined,
            ts.createBlock([
                ts.createReturn(createErrorObject({ type: 'never' }))
            ])
        );
    });
}

export function getUnknownFunction(visitorContext: VisitorContext) {
    const name = '_unknown';
    return setFunctionIfNotExists(name, visitorContext, () => {
        return createAcceptingFunction(name);
    });
}

export function getAnyFunction(visitorContext: VisitorContext) {
    const name = '_any';
    return setFunctionIfNotExists(name, visitorContext, () => {
        return createAcceptingFunction(name);
    });
}

export function getIgnoredTypeFunction(visitorContext: VisitorContext) {
    const name = '_ignore';
    return setFunctionIfNotExists(name, visitorContext, () => {
        return createAcceptingFunction(name);
    });
}

export function createBinaries(expressions: ts.Expression[], operator: ts.BinaryOperator, baseExpression?: ts.Expression) {
    if (expressions.length >= 1 || baseExpression === undefined) {
        return expressions.reduce((previous, expression) => ts.createBinary(previous, operator, expression));
    } else {
        return baseExpression;
    }
}

export function createAcceptingFunction(functionName: string) {
    return ts.createFunctionDeclaration(
        undefined,
        undefined,
        undefined,
        functionName,
        undefined,
        [],
        undefined,
        ts.createBlock([ts.createReturn(ts.createNull())])
    );
}

export function createConjunctionFunction(functionNames: string[], functionName: string, extraStatements?: ts.Statement[]) {
    const conditionsIdentifier = ts.createIdentifier('conditions');
    const conditionIdentifier = ts.createIdentifier('condition');
    const errorIdentifier = ts.createIdentifier('error');
    return ts.createFunctionDeclaration(
        undefined,
        undefined,
        undefined,
        functionName,
        undefined,
        [
            ts.createParameter(undefined, undefined, undefined, objectIdentifier, undefined, undefined, undefined)
        ],
        undefined,
        ts.createBlock([
            ts.createVariableStatement(
                [ts.createModifier(ts.SyntaxKind.ConstKeyword)],
                [
                    ts.createVariableDeclaration(
                        conditionsIdentifier,
                        undefined,
                        ts.createArrayLiteral(
                            functionNames.map((functionName) => ts.createIdentifier(functionName))
                        )
                    )
                ]
            ),
            ts.createForOf(
                undefined,
                ts.createVariableDeclarationList(
                    [ts.createVariableDeclaration(conditionIdentifier, undefined, undefined)],
                    ts.NodeFlags.Const
                ),
                conditionsIdentifier,
                ts.createBlock([
                    ts.createVariableStatement(
                        [ts.createModifier(ts.SyntaxKind.ConstKeyword)],
                        [
                            ts.createVariableDeclaration(
                                errorIdentifier,
                                undefined,
                                ts.createCall(
                                    conditionIdentifier,
                                    undefined,
                                    [objectIdentifier]
                                )
                            )
                        ]
                    ),
                    ts.createIf(
                        errorIdentifier,
                        ts.createReturn(errorIdentifier)
                    )
                ])
            ),
            ...(extraStatements || []),
            ts.createReturn(ts.createNull())
        ])
    );
}

export function createDisjunctionFunction(functionNames: string[], functionName: string) {
    const conditionsIdentifier = ts.createIdentifier('conditions');
    const conditionIdentifier = ts.createIdentifier('condition');
    const errorIdentifier = ts.createIdentifier('error');
    return ts.createFunctionDeclaration(
        undefined,
        undefined,
        undefined,
        functionName,
        undefined,
        [
            ts.createParameter(undefined, undefined, undefined, objectIdentifier, undefined, undefined, undefined)
        ],
        undefined,
        ts.createBlock([
            ts.createVariableStatement(
                [ts.createModifier(ts.SyntaxKind.ConstKeyword)],
                [
                    ts.createVariableDeclaration(
                        conditionsIdentifier,
                        undefined,
                        ts.createArrayLiteral(
                            functionNames.map((functionName) => ts.createIdentifier(functionName))
                        )
                    )
                ]
            ),
            ts.createForOf(
                undefined,
                ts.createVariableDeclarationList(
                    [ts.createVariableDeclaration(conditionIdentifier, undefined, undefined)],
                    ts.NodeFlags.Const
                ),
                conditionsIdentifier,
                ts.createBlock([
                    ts.createVariableStatement(
                        [ts.createModifier(ts.SyntaxKind.ConstKeyword)],
                        [
                            ts.createVariableDeclaration(
                                errorIdentifier,
                                undefined,
                                ts.createCall(
                                    conditionIdentifier,
                                    undefined,
                                    [objectIdentifier]
                                )
                            )
                        ]
                    ),
                    ts.createIf(
                        ts.createLogicalNot(errorIdentifier),
                        ts.createReturn(ts.createNull())
                    )
                ])
            ),
            ts.createReturn(createErrorObject({ type: 'union' }))
        ])
    );
}

export function createStrictNullCheckStatement(identifier: ts.Identifier, visitorContext: VisitorContext) {
    if (visitorContext.compilerOptions.strictNullChecks !== false) {
        return ts.createEmptyStatement();
    } else {
        return ts.createIf(
            ts.createBinary(
                ts.createStrictEquality(identifier, ts.createNull()),
                ts.SyntaxKind.BarBarToken,
                ts.createStrictEquality(identifier, ts.createIdentifier('undefined'))
            ),
            ts.createReturn(ts.createNull())
        );
    }
}

export function createAssertionFunction(failureCondition: ts.Expression, expected: Reason, functionName: string, ...otherStatements: ts.Statement[]) {
    return ts.createFunctionDeclaration(
        undefined,
        undefined,
        undefined,
        functionName,
        undefined,
        [
            ts.createParameter(undefined, undefined, undefined, objectIdentifier, undefined, undefined, undefined)
        ],
        undefined,
        ts.createBlock([
            ...otherStatements,
            ts.createIf(
                failureCondition,
                ts.createReturn(createErrorObject(expected)),
                ts.createReturn(ts.createNull())
            )
        ])
    );
}

export function createSuperfluousPropertiesLoop(propertyNames: string[]) {
    return ts.createForOf(
        undefined,
        ts.createVariableDeclarationList(
            [ts.createVariableDeclaration(keyIdentifier, undefined, undefined)],
            ts.NodeFlags.Const
        ),
        ts.createCall(ts.createPropertyAccess(ts.createIdentifier('Object'), 'keys'), undefined, [objectIdentifier]),
        ts.createBlock([
            ts.createIf(
                createBinaries(
                    propertyNames.map((propertyName) => ts.createStrictInequality(keyIdentifier, ts.createStringLiteral(propertyName))),
                    ts.SyntaxKind.AmpersandAmpersandToken,
                    ts.createTrue()
                ),
                ts.createReturn(createErrorObject({ type: 'superfluous-property' }))
            )
        ])
    );
}

export function isBigIntType(type: ts.Type) {
    if ('BigInt' in ts.TypeFlags) {
        return (ts.TypeFlags as any).BigInt & type.flags;
    } else {
        return false;
    }
}

function createAssertionString(reason: string | ts.Expression): ts.Expression {
    if (typeof reason === 'string') {
        return createBinaries(
            [
                ts.createStringLiteral('validation failed at '),
                ts.createCall(
                    ts.createPropertyAccess(
                        pathIdentifier,
                        'join'
                    ),
                    undefined,
                    [ts.createStringLiteral('.')]
                ),
                ts.createStringLiteral(`: ${reason}`)
            ],
            ts.SyntaxKind.PlusToken
        );
    } else {
        return createBinaries(
            [
                ts.createStringLiteral('validation failed at '),
                ts.createCall(
                    ts.createPropertyAccess(
                        pathIdentifier,
                        'join'
                    ),
                    undefined,
                    [ts.createStringLiteral('.')]
                ),
                ts.createStringLiteral(`: `),
                reason
            ],
            ts.SyntaxKind.PlusToken
        );
    }
}

export function createErrorObject(reason: Reason): ts.Expression {
    return ts.createObjectLiteral([
        ts.createPropertyAssignment('message', createErrorMessage(reason)),
        ts.createPropertyAssignment('path', ts.createCall(ts.createPropertyAccess(pathIdentifier, 'slice'), undefined, undefined)),
        ts.createPropertyAssignment('reason', serializeObjectToExpression(reason))
    ]);
}

function serializeObjectToExpression(object: unknown): ts.Expression {
    if (typeof object === 'string') {
        return ts.createStringLiteral(object);
    } else if (typeof object === 'number') {
        return ts.createNumericLiteral(object.toString());
    } else if (typeof object === 'boolean') {
        return object ? ts.createTrue() : ts.createFalse();
    } else if (typeof object === 'bigint') {
        return ts.createBigIntLiteral(object.toString());
    } else if (typeof object === 'undefined') {
        return ts.createIdentifier('undefined');
    } else if (typeof object === 'object') {
        if (object === null) {
            return ts.createNull();
        } else if (Array.isArray(object)) {
            return ts.createArrayLiteral(object.map((item) => serializeObjectToExpression(item)));
        } else {
            return ts.createObjectLiteral(Object.keys(object).map((key) => {
                const value = (object as { [Key: string]: unknown })[key];
                return ts.createPropertyAssignment(key, serializeObjectToExpression(value));
            }));
        }
    }
    throw new Error('Cannot serialize object to expression.');
}

function createErrorMessage(reason: Reason): ts.Expression {
    switch (reason.type) {
        case 'tuple':
            return createAssertionString(`expected an array with length ${reason.minLength}-${reason.maxLength}`);
        case 'array':
            return createAssertionString('expected an array');
        case 'object':
            return createAssertionString('expected an object');
        case 'missing-property':
            return createAssertionString(`expected '${reason.property}' in object`);
        case 'superfluous-property':
            return createAssertionString(createBinaries(
                [
                    ts.createStringLiteral(`superfluous property '`),
                    keyIdentifier,
                    ts.createStringLiteral(`' in object`)
                ],
                ts.SyntaxKind.PlusToken
            ));
        case 'never':
            return createAssertionString('type is never');
        case 'union':
            return createAssertionString('there are no valid alternatives');
        case 'string':
            return createAssertionString('expected a string');
        case 'boolean':
            return createAssertionString('expected a boolean');
        case 'big-int':
            return createAssertionString('expected a bigint');
        case 'number':
            return createAssertionString('expected a number');
        case 'undefined':
            return createAssertionString('expected undefined');
        case 'null':
            return createAssertionString('expected null');
        case 'object-keyof':
            return createAssertionString(`expected ${reason.properties.map((property) => `'${property}'`).join('|')}`);
        case 'string-literal':
            return createAssertionString(`expected string '${reason.value}'`);
        case 'number-literal':
            return createAssertionString(`expected number '${reason.value}'`);
        case 'boolean-literal':
            return createAssertionString(`expected ${reason.value ? 'true' : 'false'}`);
        case 'non-primitive':
            return createAssertionString('expected a non-primitive');
        case 'date':
            return createAssertionString('expected a Date');
        case 'function':
            return createAssertionString('expected a function');
    }
}
