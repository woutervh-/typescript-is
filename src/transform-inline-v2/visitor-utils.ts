import * as ts from 'typescript';
import * as tsutils from 'tsutils';
import { VisitorContext } from './visitor-context';

const objectIdentifier = ts.createIdentifier('object');
const pathIdentifier = ts.createIdentifier('path');

export function getPropertyInfo(symbol: ts.Symbol, visitorContext: VisitorContext) {
    if (!ts.isPropertySignature(symbol.valueDeclaration)) {
        throw new Error('Unsupported declaration kind: ' + symbol.valueDeclaration.kind);
    }
    if (symbol.valueDeclaration.type === undefined) {
        throw new Error('Found property without type.');
    }
    const propertyType = visitorContext.checker.getTypeFromTypeNode(symbol.valueDeclaration.type);
    return {
        name: symbol.name,
        type: propertyType,
        optional: !!symbol.valueDeclaration.questionToken
    };
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
    mappedType = mappedType || type.getDefault();
    return mappedType;
}

interface TypeCheckNameMode {
    type: 'type-check';
}

interface KeyofNameMode {
    type: 'keyof';
}

interface IndexedAccessNameMode {
    type: 'indexed-access';
    indexType: ts.Type;
}

type NameMode = TypeCheckNameMode | KeyofNameMode | IndexedAccessNameMode;

export function getFullTypeName(type: ts.Type, visitorContext: VisitorContext, mode: NameMode) {
    // Internal TypeScript API:
    let name = `_${(type as unknown as { id: string }).id}`;
    if (mode.type === 'keyof') {
        name += '_keyof';
    }
    if (mode.type === 'indexed-access') {
        const indexTypeName = getFullTypeName(mode.indexType, visitorContext, { type: 'type-check' });
        name += `_ia__${indexTypeName}`;
    }
    for (const mapping of visitorContext.typeMapperStack) {
        mapping.forEach((typeArgument) => {
            name += `_${(typeArgument as unknown as { id: string }).id}`;
        });
    }
    return name;
}

export function getStringFunction(visitorContext: VisitorContext) {
    const name = '_string';
    if (!visitorContext.functionMap.has(name)) {
        visitorContext.functionMap.set(
            name,
            createAssertionFunction(
                ts.createStrictInequality(
                    ts.createTypeOf(objectIdentifier),
                    ts.createStringLiteral('string')
                ),
                `expected a string`,
                name
            )
        );
    }
    return visitorContext.functionMap.get(name)!;
}

export function getBooleanFunction(visitorContext: VisitorContext) {
    const name = '_boolean';
    if (!visitorContext.functionMap.has(name)) {
        visitorContext.functionMap.set(
            name,
            createAssertionFunction(
                ts.createStrictInequality(
                    ts.createTypeOf(objectIdentifier),
                    ts.createStringLiteral('boolean')
                ),
                'expected a boolean',
                name
            )
        );
    }
    return visitorContext.functionMap.get(name)!;
}

export function getBigintFunction(visitorContext: VisitorContext) {
    const name = '_bigint';
    if (!visitorContext.functionMap.has(name)) {
        visitorContext.functionMap.set(
            name,
            createAssertionFunction(
                ts.createStrictInequality(
                    ts.createTypeOf(objectIdentifier),
                    ts.createStringLiteral('bigint')
                ),
                'expected a bigint',
                name
            )
        );
    }
    return visitorContext.functionMap.get(name)!;
}

export function getNumberFunction(visitorContext: VisitorContext) {
    const name = '_number';
    if (!visitorContext.functionMap.has(name)) {
        visitorContext.functionMap.set(
            name,
            createAssertionFunction(
                ts.createStrictInequality(
                    ts.createTypeOf(objectIdentifier),
                    ts.createStringLiteral('number')
                ),
                'expected a number',
                name
            )
        );
    }
    return visitorContext.functionMap.get(name)!;
}

export function getUndefinedFunction(visitorContext: VisitorContext) {
    const name = '_undefined';
    if (!visitorContext.functionMap.has(name)) {
        visitorContext.functionMap.set(
            name,
            createAssertionFunction(
                ts.createStrictInequality(
                    objectIdentifier,
                    ts.createIdentifier('undefined')
                ),
                'expected undefined',
                name
            )
        );
    }
    return visitorContext.functionMap.get(name)!;
}

export function getNullFunction(visitorContext: VisitorContext) {
    const name = '_null';
    if (!visitorContext.functionMap.has(name)) {
        visitorContext.functionMap.set(
            name,
            createAssertionFunction(
                ts.createStrictInequality(
                    objectIdentifier,
                    ts.createNull()
                ),
                'expected null',
                name
            )
        );
    }
    return visitorContext.functionMap.get(name)!;
}

export function getNeverFunction(visitorContext: VisitorContext) {
    const name = '_never';
    if (!visitorContext.functionMap.has(name)) {
        visitorContext.functionMap.set(
            name,
            createRejectingFunction('type is never', name)
        );
    }
    return visitorContext.functionMap.get(name)!;
}

export function getUnknownFunction(visitorContext: VisitorContext) {
    const name = '_unknown';
    if (!visitorContext.functionMap.has(name)) {
        visitorContext.functionMap.set(
            name,
            createAcceptingFunction(name)
        );
    }
    return visitorContext.functionMap.get(name)!;
}

export function getAnyFunction(visitorContext: VisitorContext) {
    const name = '_any';
    if (!visitorContext.functionMap.has(name)) {
        visitorContext.functionMap.set(
            name,
            createAcceptingFunction(name)
        );
    }
    return visitorContext.functionMap.get(name)!;
}

export function createBinaries(expressions: ts.Expression[], operator: ts.BinaryOperator) {
    return expressions.reduce((previous, expression) => ts.createBinary(previous, operator, expression));
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

export function createRejectingFunction(reason: string, functionName: string) {
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
            ts.createReturn(
                createBinaries(
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
                )
            )
        ])
    );
}

export function createConjunctionFunction(functionDeclarations: ts.FunctionDeclaration[], functionName: string) {
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
                            functionDeclarations.map((functionDeclaration) => functionDeclaration.name!)
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
                        ts.createReturn(
                            createBinaries(
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
                                    errorIdentifier
                                ],
                                ts.SyntaxKind.PlusToken
                            )
                        )
                    )
                ])
            ),
            ts.createReturn(ts.createNull())
        ])
    );
}

export function createDisjunctionFunction(functionDeclarations: ts.FunctionDeclaration[], functionName: string) {
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
                            functionDeclarations.map((functionDeclaration) => functionDeclaration.name!)
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
            ts.createReturn(
                createBinaries(
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
                        ts.createStringLiteral(`: there are no valid alternatives.`)
                    ],
                    ts.SyntaxKind.PlusToken
                )
            )
        ])
    );
}

export function createAssertionFunction(failureCondition: ts.Expression, reason: string, functionName: string) {
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
            ts.createIf(
                failureCondition,
                ts.createReturn(
                    createBinaries(
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
                    )
                ),
                ts.createReturn(ts.createNull())
            )
        ])
    );
}
