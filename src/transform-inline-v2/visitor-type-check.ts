import * as ts from 'typescript';
import * as tsutils from 'tsutils';
import { VisitorContext } from './visitor-context';

const objectIdentifier = ts.createIdentifier('object');
const pathIdentifier = ts.createIdentifier('path');

function getResolvedTypeParameter(type: ts.Type, visitorContext: VisitorContext) {
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

function getNameAndTypeOfSymbol(symbol: ts.Symbol, visitorContext: VisitorContext) {
    if (!ts.isPropertySignature(symbol.valueDeclaration)) {
        throw new Error('Unsupported declaration kind: ' + symbol.valueDeclaration.kind);
    }
    if (symbol.valueDeclaration.type === undefined) {
        throw new Error('Found property without type.');
    }
    const propertyType = visitorContext.checker.getTypeFromTypeNode(symbol.valueDeclaration.type);
    return {
        name: symbol.name,
        type: propertyType
    };
}

function getFullTypeName(type: ts.Type, visitorContext: VisitorContext) {
    // Internal TypeScript API:
    let name = `_${(type as unknown as { id: string }).id}`;
    for (const mapping of visitorContext.typeMapperStack) {
        mapping.forEach((typeArgument) => {
            name += `_${(typeArgument as unknown as { id: string }).id}`;
        });
    }
    return name;
}

function createBinaries(expressions: ts.Expression[], operator: ts.BinaryOperator) {
    return expressions.reduce((previous, expression) => ts.createBinary(previous, operator, expression));
}

function createAcceptingFunction(functionName: string) {
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

function createRejectingFunction(reason: string, functionName: string) {
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

function createConjunctionFunction(functionDeclarations: ts.FunctionDeclaration[], functionName: string) {
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

function createDisjunctionFunction(functionDeclarations: ts.FunctionDeclaration[], functionName: string) {
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

function createAssertionFunction(expression: ts.Expression, reason: string, functionName: string) {
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
                expression,
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

function visitTupleObjectType(type: ts.TupleType, visitorContext: VisitorContext) {
    const name = getFullTypeName(type, visitorContext);
    if (!visitorContext.functionMap.has(name)) {
        if (type.typeArguments === undefined) {
            throw new Error('Expected tuple type to have type arguments.');
        }

        const functionDeclarations = type.typeArguments.map((type) => visitType(type, visitorContext));
        const errorIdentifier = ts.createIdentifier('error');

        visitorContext.functionMap.set(
            name,
            ts.createFunctionDeclaration(
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
                    ts.createIf(
                        ts.createBinary(
                            ts.createLogicalNot(
                                ts.createCall(
                                    ts.createPropertyAccess(ts.createIdentifier('Array'), 'isArray'),
                                    undefined,
                                    [objectIdentifier]
                                )
                            ),
                            ts.SyntaxKind.BarBarToken,
                            ts.createStrictInequality(
                                ts.createPropertyAccess(
                                    objectIdentifier,
                                    'length'
                                ),
                                ts.createNumericLiteral(type.typeArguments.length.toString())
                            )
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
                                    ts.createStringLiteral(`: expected an array of length ${type.typeArguments.length}`)
                                ],
                                ts.SyntaxKind.PlusToken
                            )
                        )
                    ),
                    ...functionDeclarations.map((functionDeclaration, index) =>
                        ts.createBlock([
                            ts.createExpressionStatement(
                                ts.createCall(
                                    ts.createPropertyAccess(pathIdentifier, 'push'),
                                    undefined,
                                    [ts.createStringLiteral(`[${index}]`)]
                                )
                            ),
                            ts.createVariableStatement(
                                [ts.createModifier(ts.SyntaxKind.ConstKeyword)],
                                [
                                    ts.createVariableDeclaration(
                                        errorIdentifier,
                                        undefined,
                                        ts.createCall(
                                            functionDeclaration.name!,
                                            undefined,
                                            [objectIdentifier]
                                        )
                                    )
                                ]
                            ),
                            ts.createExpressionStatement(
                                ts.createCall(
                                    ts.createPropertyAccess(pathIdentifier, 'pop'),
                                    undefined,
                                    undefined
                                )
                            ),
                            ts.createIf(
                                errorIdentifier,
                                ts.createReturn(errorIdentifier)
                            )
                        ])
                    ),
                    ts.createReturn(ts.createNull())
                ])
            )
        );
    }
    return visitorContext.functionMap.get(name)!;
}

function visitArrayObjectType(type: ts.ObjectType, visitorContext: VisitorContext) {
    const name = getFullTypeName(type, visitorContext);
    if (!visitorContext.functionMap.has(name)) {
        const numberIndexType = visitorContext.checker.getIndexTypeOfType(type, ts.IndexKind.Number);
        if (numberIndexType === undefined) {
            throw new Error('Expected array ObjectType to have a number index type.');
        }
        const functionDeclaration = visitType(numberIndexType, visitorContext);
        const indexIdentifier = ts.createIdentifier('i');
        const errorIdentifier = ts.createIdentifier('error');
        visitorContext.functionMap.set(
            name,
            ts.createFunctionDeclaration(
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
                    ts.createIf(
                        ts.createLogicalNot(
                            ts.createCall(
                                ts.createPropertyAccess(ts.createIdentifier('Array'), 'isArray'),
                                undefined,
                                [objectIdentifier]
                            )
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
                                    ts.createStringLiteral(`: expected an array`)
                                ],
                                ts.SyntaxKind.PlusToken
                            )
                        )
                    ),
                    ts.createFor(
                        ts.createVariableDeclarationList(
                            [ts.createVariableDeclaration(indexIdentifier, undefined, ts.createNumericLiteral('0'))],
                            ts.NodeFlags.Let
                        ),
                        ts.createBinary(
                            indexIdentifier,
                            ts.SyntaxKind.LessThanToken,
                            ts.createPropertyAccess(objectIdentifier, 'length')
                        ),
                        ts.createPostfixIncrement(indexIdentifier),
                        ts.createBlock([
                            ts.createExpressionStatement(
                                ts.createCall(
                                    ts.createPropertyAccess(pathIdentifier, 'push'),
                                    undefined,
                                    [
                                        createBinaries(
                                            [
                                                ts.createStringLiteral('['),
                                                indexIdentifier,
                                                ts.createStringLiteral(']')
                                            ],
                                            ts.SyntaxKind.PlusToken
                                        )
                                    ]
                                )
                            ),
                            ts.createVariableStatement(
                                [ts.createModifier(ts.SyntaxKind.ConstKeyword)],
                                [
                                    ts.createVariableDeclaration(
                                        errorIdentifier,
                                        undefined,
                                        ts.createCall(
                                            functionDeclaration.name!,
                                            undefined,
                                            [objectIdentifier]
                                        )
                                    )
                                ]
                            ),
                            ts.createExpressionStatement(
                                ts.createCall(
                                    ts.createPropertyAccess(pathIdentifier, 'pop'),
                                    undefined,
                                    undefined
                                )
                            ),
                            ts.createIf(
                                errorIdentifier,
                                ts.createReturn(errorIdentifier)
                            )
                        ])
                    ),
                    ts.createReturn(ts.createNull())
                ])
            )
        );
    }
    return visitorContext.functionMap.get(name)!;
}

function visitRegularObjectType(type: ts.ObjectType, visitorContext: VisitorContext) {
    const name = getFullTypeName(type, visitorContext);
    if (!visitorContext.functionMap.has(name)) {
        const properties = visitorContext.checker.getPropertiesOfType(type);
        // const keyIdentifier = ts.createIdentifier('key');
        const errorIdentifier = ts.createIdentifier('error');

        visitorContext.functionMap.set(
            name,
            ts.createFunctionDeclaration(
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
                    ts.createIf(
                        createBinaries(
                            [
                                ts.createStrictInequality(
                                    ts.createTypeOf(objectIdentifier),
                                    ts.createStringLiteral('object')
                                ),
                                ts.createStrictEquality(
                                    objectIdentifier,
                                    ts.createNull()
                                ),
                                ts.createCall(
                                    ts.createPropertyAccess(ts.createIdentifier('Array'), 'isArray'),
                                    undefined,
                                    [objectIdentifier]
                                )
                            ],
                            ts.SyntaxKind.BarBarToken
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
                                    ts.createStringLiteral(`: expected an object`)
                                ],
                                ts.SyntaxKind.PlusToken
                            )
                        )
                    ),
                    ...properties.map((property) => {
                        const propertyNameAndType = getNameAndTypeOfSymbol(property, visitorContext);
                        const functionDeclaration = visitType(propertyNameAndType.type, visitorContext);
                        return ts.createBlock([
                            ts.createExpressionStatement(
                                ts.createCall(
                                    ts.createPropertyAccess(pathIdentifier, 'push'),
                                    undefined,
                                    [ts.createStringLiteral(propertyNameAndType.name)]
                                )
                            ),
                            ts.createVariableStatement(
                                [ts.createModifier(ts.SyntaxKind.ConstKeyword)],
                                [
                                    ts.createVariableDeclaration(
                                        errorIdentifier,
                                        undefined,
                                        ts.createCall(
                                            functionDeclaration.name!,
                                            undefined,
                                            [ts.createPropertyAccess(objectIdentifier, propertyNameAndType.name)]
                                        )
                                    )
                                ]
                            ),
                            ts.createExpressionStatement(
                                ts.createCall(
                                    ts.createPropertyAccess(pathIdentifier, 'pop'),
                                    undefined,
                                    undefined
                                )
                            )
                        ]);
                    }),
                    // TODO: check property index,
                    // ts.createForOf(
                    //     undefined,
                    //     ts.createVariableDeclarationList(
                    //         [ts.createVariableDeclaration(keyIdentifier, undefined, undefined)],
                    //         ts.NodeFlags.Const
                    //     ),
                    //     ts.createCall(ts.createPropertyAccess(ts.createIdentifier('Object'), 'keys'), undefined, [objectIdentifier]),
                    //     ts.createBlock([
                    //         ts.createExpressionStatement(
                    //             ts.createCall(
                    //                 ts.createPropertyAccess(pathIdentifier, 'push'),
                    //                 undefined,
                    //                 []
                    //             )
                    //         ),
                    //     ])
                    // ),
                    ts.createReturn(ts.createNull())
                ])
            )
        );
    }
    return visitorContext.functionMap.get(name)!;
}

function visitTypeReference(type: ts.TypeReference, visitorContext: VisitorContext) {
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
    const previousTypeReference = visitorContext.previousTypeReference;
    visitorContext.typeMapperStack.push(mapping);
    visitorContext.previousTypeReference = type;
    const result = visitType(type.target, visitorContext);
    visitorContext.previousTypeReference = previousTypeReference;
    visitorContext.typeMapperStack.pop();
    return result;
}

function visitTypeParameter(type: ts.Type, visitorContext: VisitorContext) {
    const mappedType = getResolvedTypeParameter(type, visitorContext);
    if (mappedType === undefined) {
        throw new Error('Unbound type parameter, missing type node.');
    }
    return visitType(mappedType, visitorContext);
}

function visitObjectType(type: ts.ObjectType, visitorContext: VisitorContext) {
    if (tsutils.isTupleType(type)) {
        // Tuple with finite length.
        return visitTupleObjectType(type, visitorContext);
    } else if (visitorContext.checker.getIndexTypeOfType(type, ts.IndexKind.Number)) {
        // Index type is number -> array type.
        return visitArrayObjectType(type, visitorContext);
    } else {
        // Index type is string -> regular object type.
        return visitRegularObjectType(type, visitorContext);
    }
}

function visitLiteralType(type: ts.LiteralType, visitorContext: VisitorContext) {
    if (typeof type.value === 'string') {
        const name = getFullTypeName(type, visitorContext);
        if (!visitorContext.functionMap.has(name)) {
            visitorContext.functionMap.set(
                name,
                createAssertionFunction(
                    ts.createStrictInequality(
                        objectIdentifier,
                        ts.createStringLiteral(type.value)
                    ),
                    `expected string '${type.value}'`,
                    name
                )
            );
        }
        return visitorContext.functionMap.get(name)!;
    } else if (typeof type.value === 'number') {
        const name = getFullTypeName(type, visitorContext);
        if (!visitorContext.functionMap.has(name)) {
            visitorContext.functionMap.set(
                name,
                createAssertionFunction(
                    ts.createStrictInequality(
                        objectIdentifier,
                        ts.createNumericLiteral(type.value.toString())
                    ),
                    `expected number '${type.value}'`,
                    name
                )
            );
        }
        return visitorContext.functionMap.get(name)!;
    } else {
        throw new Error('Type value is expected to be a string or number.');
    }
}

function visitUnionOrIntersectionType(type: ts.UnionOrIntersectionType, visitorContext: VisitorContext) {
    const name = getFullTypeName(type, visitorContext);
    if (!visitorContext.functionMap.has(name)) {
        const functionDeclarations = type.types.map((type) => visitType(type, visitorContext));

        if (tsutils.isUnionType(type)) {
            visitorContext.functionMap.set(
                name,
                createDisjunctionFunction(functionDeclarations, name)
            );
        } else {
            visitorContext.functionMap.set(
                name,
                createConjunctionFunction(functionDeclarations, name)
            );
        }
    }
    return visitorContext.functionMap.get(name)!;
}

function visitBooleanLiteral(type: ts.Type, visitorContext: VisitorContext) {
    // Using internal TypeScript API, hacky.
    const intrinsicName: string | undefined = (type as { intrinsicName?: string }).intrinsicName;
    if (intrinsicName === 'true') {
        const name = '_true';
        if (!visitorContext.functionMap.has(name)) {
            visitorContext.functionMap.set(
                name,
                createAssertionFunction(
                    ts.createStrictInequality(
                        objectIdentifier,
                        ts.createTrue()
                    ),
                    `expected true`,
                    name
                )
            );
        }
        return visitorContext.functionMap.get(name)!;
    } else if (intrinsicName === 'false') {
        const name = '_false';
        if (!visitorContext.functionMap.has(name)) {
            visitorContext.functionMap.set(
                name,
                createAssertionFunction(
                    ts.createStrictInequality(
                        objectIdentifier,
                        ts.createFalse()
                    ),
                    `expected false`,
                    name
                )
            );
        }
        return visitorContext.functionMap.get(name)!;
    } else {
        throw new Error(`Unsupported boolean literal with intrinsic name: ${intrinsicName}.`);
    }
}

function visitNonPrimitiveType(type: ts.Type, visitorContext: VisitorContext) {
    // Using internal TypeScript API, hacky.
    const intrinsicName: string | undefined = (type as { intrinsicName?: string }).intrinsicName;
    if (intrinsicName === 'object') {
        const name = '_object';
        if (!visitorContext.functionMap.has(name)) {
            const conditions: ts.Expression[] = [
                ts.createStrictInequality(
                    ts.createTypeOf(objectIdentifier),
                    ts.createStringLiteral('boolean')
                ),
                ts.createStrictInequality(
                    ts.createTypeOf(objectIdentifier),
                    ts.createStringLiteral('number')
                ),
                ts.createStrictInequality(
                    ts.createTypeOf(objectIdentifier),
                    ts.createStringLiteral('string')
                ),
                ts.createStrictInequality(
                    objectIdentifier,
                    ts.createNull()
                ),
                ts.createStrictInequality(
                    objectIdentifier,
                    ts.createIdentifier('undefined')
                )
            ];
            const condition = conditions.reduce((condition, expression) =>
                ts.createBinary(
                    condition,
                    ts.SyntaxKind.AmpersandAmpersandToken,
                    expression
                )
            );
            visitorContext.functionMap.set(
                name,
                createAssertionFunction(
                    ts.createLogicalNot(condition),
                    `expected a non-primitive`,
                    name
                )
            );
        }
        return visitorContext.functionMap.get(name)!;
    } else {
        throw new Error(`Unsupported non-primitive with intrinsic name: ${intrinsicName}.`);
    }
}

function visitAny(visitorContext: VisitorContext) {
    const name = '_any';
    if (!visitorContext.functionMap.has(name)) {
        visitorContext.functionMap.set(
            name,
            createAcceptingFunction(name)
        );
    }
    return visitorContext.functionMap.get(name)!;
}

function visitUnknown(visitorContext: VisitorContext) {
    const name = '_unknown';
    if (!visitorContext.functionMap.has(name)) {
        visitorContext.functionMap.set(
            name,
            createAcceptingFunction(name)
        );
    }
    return visitorContext.functionMap.get(name)!;
}

function visitNever(visitorContext: VisitorContext) {
    const name = '_never';
    if (!visitorContext.functionMap.has(name)) {
        visitorContext.functionMap.set(
            name,
            createRejectingFunction('type is never', name)
        );
    }
    return visitorContext.functionMap.get(name)!;
}

function visitNull(visitorContext: VisitorContext) {
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

function visitUndefined(visitorContext: VisitorContext) {
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

function visitNumber(visitorContext: VisitorContext) {
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

function visitBigInt(visitorContext: VisitorContext) {
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

function visitBoolean(visitorContext: VisitorContext) {
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

function visitString(visitorContext: VisitorContext) {
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

export function visitType(type: ts.Type, visitorContext: VisitorContext): ts.FunctionDeclaration {
    if ((ts.TypeFlags.Any & type.flags) !== 0) {
        // Any
        return visitAny(visitorContext);
    } else if ((ts.TypeFlags.Unknown & type.flags) !== 0) {
        // Unknown
        return visitUnknown(visitorContext);
    } else if ((ts.TypeFlags.Never & type.flags) !== 0) {
        // Never
        return visitNever(visitorContext);
    } else if ((ts.TypeFlags.Null & type.flags) !== 0) {
        // Null
        return visitNull(visitorContext);
    } else if ((ts.TypeFlags.Undefined & type.flags) !== 0) {
        // Undefined
        return visitUndefined(visitorContext);
    } else if ((ts.TypeFlags.Number & type.flags) !== 0) {
        // Number
        return visitNumber(visitorContext);
    } else if ((ts.TypeFlags.BigInt & type.flags) !== 0) {
        // BigInt
        return visitBigInt(visitorContext);
    } else if ((ts.TypeFlags.Boolean & type.flags) !== 0) {
        // Boolean
        return visitBoolean(visitorContext);
    } else if ((ts.TypeFlags.String & type.flags) !== 0) {
        // String
        return visitString(visitorContext);
    } else if ((ts.TypeFlags.BooleanLiteral & type.flags) !== 0) {
        // Boolean literal (true/false)
        return visitBooleanLiteral(type, visitorContext);
    } else if (tsutils.isTypeReference(type) && visitorContext.previousTypeReference !== type) {
        // Type references.
        return visitTypeReference(type, visitorContext);
    } else if ((ts.TypeFlags.TypeParameter & type.flags) !== 0) {
        // Type parameter
        return visitTypeParameter(type, visitorContext);
    } else if (tsutils.isObjectType(type)) {
        // Object type (including interfaces, arrays, tuples)
        if ((ts.ObjectFlags.Class & type.objectFlags) !== 0) {
            throw new Error('Classes cannot be validated. Please check the README.');
        } else {
            return visitObjectType(type, visitorContext);
        }
    } else if (tsutils.isLiteralType(type)) {
        // Literal string/number types ('foo')
        return visitLiteralType(type, visitorContext);
    } else if (tsutils.isUnionOrIntersectionType(type)) {
        // Union or intersection type (| or &)
        return visitUnionOrIntersectionType(type, visitorContext);
    } else if ((ts.TypeFlags.NonPrimitive & type.flags) !== 0) {
        // Non-primitive such as object
        return visitNonPrimitiveType(type, visitorContext);
        // } else if ((ts.TypeFlags.Index & type.flags) !== 0) {
        //     // Index type: keyof T
        //     return visitIndexType(type, visitorContext);
        // } else if (tsutils.isIndexedAccessType(type)) {
        //     // Indexed access type: T[U]
        //     return visitIndexedAccessType(type, visitorContext);
    } else {
        throw new Error('Could not generate type-check; unsupported type with flags: ' + type.flags);
    }
}

export function visitUndefinedOrType(type: ts.Type, visitorContext: VisitorContext) {
    const errorIdentifier = ts.createIdentifier('error');
    const functionDeclaration = visitType(type, visitorContext);
    return ts.createFunctionDeclaration(
        undefined,
        undefined,
        undefined,
        `optional_${functionDeclaration.name!.text}`,
        undefined,
        [
            ts.createParameter(undefined, undefined, undefined, objectIdentifier, undefined, undefined, undefined)
        ],
        undefined,
        ts.createBlock([
            ts.createIf(
                ts.createStrictInequality(
                    objectIdentifier,
                    ts.createIdentifier('undefined')
                ),
                ts.createBlock([
                    ts.createVariableStatement(
                        [ts.createModifier(ts.SyntaxKind.ConstKeyword)],
                        [
                            ts.createVariableDeclaration(
                                errorIdentifier,
                                undefined,
                                ts.createCall(
                                    functionDeclaration.name!,
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
            ts.createReturn(ts.createNull())
        ])
    );
}
