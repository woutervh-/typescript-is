import * as ts from 'typescript';
import * as tsutils from 'tsutils';
import { VisitorContext } from './visitor-context';

const objectIdentifier = ts.createIdentifier('object');
const pathIdentifier = ts.createIdentifier('path');

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
    if (!visitorContext.functionMap.has(type)) {
        if (type.typeArguments === undefined) {
            throw new Error('Expected tuple type to have type arguments.');
        }

        const functionDeclarations = type.typeArguments.map((type) => visitType(type, visitorContext));
        const errorIdentifier = ts.createIdentifier('error');

        visitorContext.functionMap.set(
            type,
            ts.createFunctionDeclaration(
                undefined,
                undefined,
                undefined,
                `f${visitorContext.functionMap.size}`,
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
    return visitorContext.functionMap.get(type)!;
}

function visitArrayObjectType(type: ts.ObjectType, visitorContext: VisitorContext) {
    if (!visitorContext.functionMap.has(type)) {
        const numberIndexType = visitorContext.checker.getIndexTypeOfType(type, ts.IndexKind.Number);
        if (numberIndexType === undefined) {
            throw new Error('Expected array ObjectType to have a number index type.');
        }
        const functionDeclaration = visitType(numberIndexType, visitorContext);
        const indexIdentifier = ts.createIdentifier('i');
        const errorIdentifier = ts.createIdentifier('error');
        visitorContext.functionMap.set(
            type,
            ts.createFunctionDeclaration(
                undefined,
                undefined,
                undefined,
                `f${visitorContext.functionMap.size}`,
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
    return visitorContext.functionMap.get(type)!;
}

function visitRegularObjectType(type: ts.ObjectType, visitorContext: VisitorContext) {
    if (!visitorContext.functionMap.has(type)) {
        const properties = visitorContext.checker.getPropertiesOfType(type);
        // const keyIdentifier = ts.createIdentifier('key');
        const errorIdentifier = ts.createIdentifier('error');

        visitorContext.functionMap.set(
            type,
            ts.createFunctionDeclaration(
                undefined,
                undefined,
                undefined,
                `f${visitorContext.functionMap.size}`,
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
                    ...properties.map((property) =>
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
                            )
                        ])
                    )
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
    return visitorContext.functionMap.get(type)!;

    // if (visitorContext.mode.type === 'type-check') {
    //     const validationReports: ValidationReport[] = [];
    //     validationReports.push(
    //         // Check the object itself: is it an object? Not an array? Not null?
    //         createConditionalValidationReport(
    //             visitorContext.pathStack.slice(),
    //             [
    //                 ts.createStrictEquality(
    //                     ts.createTypeOf(accessor),
    //                     ts.createStringLiteral('object')
    //                 ),
    //                 ts.createStrictInequality(
    //                     accessor,
    //                     ts.createNull()
    //                 ),
    //                 ts.createLogicalNot(
    //                     ts.createCall(
    //                         ts.createPropertyAccess(ts.createIdentifier('Array'), ts.createIdentifier('isArray')),
    //                         undefined,
    //                         [accessor]
    //                     )
    //                 )
    //             ].reduce((condition, expression) =>
    //                 ts.createBinary(
    //                     condition,
    //                     ts.SyntaxKind.AmpersandAmpersandToken,
    //                     expression
    //                 )
    //             ),
    //             'expected object'
    //         )
    //     );
    //     for (const property of properties) {
    //         // Visit each property.
    //         validationReports.push(visitPropertySymbol(property, accessor, visitorContext));
    //     }
    //     const stringIndexType = visitorContext.checker.getIndexTypeOfType(type, ts.IndexKind.String);
    //     if (stringIndexType) {
    //         // There is a string index type { [Key: string]: T }.
    //         const keyIdentifier = ts.createIdentifier('key');
    //         const itemAccessor = ts.createElementAccess(accessor, keyIdentifier);
    //         visitorContext.pathStack.push('[]');
    //         const typeReport = visitType(stringIndexType, itemAccessor, visitorContext);
    //         visitorContext.pathStack.pop();
    //         validationReports.push(
    //             createObjectEveryValidationReport(
    //                 visitorContext.pathStack.slice(),
    //                 accessor,
    //                 keyIdentifier,
    //                 typeReport
    //             )
    //         );
    //     }

    //     return createConjunctionValidationReport(visitorContext.pathStack.slice(), validationReports);
    // } else if (visitorContext.mode.type === 'string-literal-keyof') {
    //     const value = visitorContext.mode.value;
    //     const match = properties.some((property) => property.name === value);
    //     if (match) {
    //         return createAlwaysTrueValidationReport(visitorContext.pathStack);
    //     } else {
    //         return createAlwaysFalseValidationReport(visitorContext.pathStack.slice(), `'${visitorContext.mode.value}' is not assignable to any key of object.`);
    //     }
    // } else if (visitorContext.mode.type === 'keyof') {
    //     // In keyof mode we check if the accessor is equal to one of the property names.
    //     return createConditionalValidationReport(
    //         visitorContext.pathStack.slice(),
    //         properties
    //             .map((property) =>
    //                 ts.createStrictEquality(accessor, ts.createStringLiteral(property.name))
    //             )
    //             .reduce<ts.Expression>((condition, expression) =>
    //                 ts.createBinary(
    //                     condition,
    //                     ts.SyntaxKind.BarBarToken,
    //                     expression
    //                 ),
    //                 ts.createFalse()
    //             ),
    //         `expected one of (${properties.map((property) => property.name).join(', ')})`
    //     );
    // } else if (visitorContext.mode.type === 'indexed-access') {
    //     // In indexed-access mode we check if the accessor is of the property type T[U].
    //     const indexType = visitorContext.mode.indexType;
    //     return createDisjunctionValidationReport(
    //         visitorContext.pathStack.slice(),
    //         properties
    //             .map((property) => {
    //                 // TODO: would be cool to have checker.isAssignableTo(indexType, createStringLiteralType(property.name))
    //                 // https://github.com/Microsoft/TypeScript/issues/9879
    //                 const stringLiteralReport = visitType(indexType, accessor, { ...visitorContext, mode: { type: 'string-literal', value: property.name } });
    //                 if (reduceNonConditionals(stringLiteralReport)) {
    //                     return visitPropertySymbol(property, accessor, visitorContext);
    //                 } else {
    //                     return createAlwaysTrueValidationReport(visitorContext.pathStack);
    //                 }
    //             })
    //     );
    // } else if (visitorContext.mode.type === 'string-literal') {
    //     return createAlwaysFalseValidationReport(visitorContext.pathStack.slice(), 'Object type cannot be used as an index type.');
    // } else {
    //     throw new Error('Not yet implemented.');
    // }
}

function visitTypeReference(type: ts.TypeReference, visitorContext: VisitorContext) {
    const mappers: ((source: ts.Type) => ts.Type | undefined)[] = [];
    (function checkBaseTypes(type: ts.TypeReference) {
        if (tsutils.isInterfaceType(type.target)) {
            const baseTypes = visitorContext.checker.getBaseTypes(type.target);
            for (const baseType of baseTypes) {
                if (tsutils.isTypeReference(baseType) && baseType.target.typeParameters !== undefined && baseType.typeArguments !== undefined) {
                    const typeParameters = baseType.target.typeParameters;
                    const typeArguments = baseType.typeArguments;
                    mappers.push((source: ts.Type) => {
                        for (let i = 0; i < typeParameters.length; i++) {
                            if (source === typeParameters[i]) {
                                return typeArguments[i];
                            }
                        }
                    });
                    checkBaseTypes(baseType);
                }
            }
        }
    })(type);
    if (type.target.typeParameters !== undefined && type.typeArguments !== undefined) {
        const typeParameters = type.target.typeParameters;
        const typeArguments = type.typeArguments;
        mappers.push((source: ts.Type) => {
            for (let i = 0; i < typeParameters.length; i++) {
                if (source === typeParameters[i]) {
                    return typeArguments[i];
                }
            }
        });
    }
    const mapper = mappers.reduce<(source: ts.Type) => ts.Type | undefined>((previous, next) => (source: ts.Type) => previous(source) || next(source), () => undefined);
    const previousTypeReference = visitorContext.previousTypeReference;
    visitorContext.typeMapperStack.push(mapper);
    visitorContext.previousTypeReference = type;
    const result = visitType(type.target, visitorContext);
    visitorContext.previousTypeReference = previousTypeReference;
    visitorContext.typeMapperStack.pop();
    return result;
}

function visitTypeParameter(type: ts.Type, visitorContext: VisitorContext) {
    const typeMapper = visitorContext.typeMapperStack.reduceRight<(source: ts.Type) => ts.Type | undefined>((previous, next) => (source: ts.Type) => previous(source) || next(source), () => undefined);
    const mappedType = typeMapper(type) || type.getDefault();
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
    if (!visitorContext.functionMap.has(type)) {
        if (typeof type.value === 'string') {
            visitorContext.functionMap.set(
                type,
                createAssertionFunction(
                    ts.createStrictInequality(
                        objectIdentifier,
                        ts.createStringLiteral(type.value)
                    ),
                    `expected string '${type.value}'`,
                    `f${visitorContext.functionMap.size}`
                )
            );
        } else if (typeof type.value === 'number') {
            visitorContext.functionMap.set(
                type,
                createAssertionFunction(
                    ts.createStrictInequality(
                        objectIdentifier,
                        ts.createNumericLiteral(type.value.toString())
                    ),
                    `expected number '${type.value}'`,
                    `f${visitorContext.functionMap.size}`
                )
            );
        } else {
            throw new Error('Type value is expected to be a string or number.');
        }
    }
    return visitorContext.functionMap.get(type)!;
}

function visitUnionOrIntersectionType(type: ts.UnionOrIntersectionType, visitorContext: VisitorContext) {
    if (!visitorContext.functionMap.has(type)) {
        const functionDeclarations = type.types.map((type) => visitType(type, visitorContext));

        if (tsutils.isUnionType(type)) {
            visitorContext.functionMap.set(
                type,
                createDisjunctionFunction(functionDeclarations, `f${visitorContext.functionMap.size}`)
            );
        } else {
            visitorContext.functionMap.set(
                type,
                createConjunctionFunction(functionDeclarations, `f${visitorContext.functionMap.size}`)
            );
        }
    }
    return visitorContext.functionMap.get(type)!;
}

function visitBooleanLiteral(type: ts.Type, visitorContext: VisitorContext) {
    if (!visitorContext.functionMap.has(type)) {
        // Using internal TypeScript API, hacky.
        const intrinsicName: string | undefined = (type as { intrinsicName?: string }).intrinsicName;
        if (intrinsicName === 'true') {
            visitorContext.functionMap.set(
                type,
                createAssertionFunction(
                    ts.createStrictInequality(
                        objectIdentifier,
                        ts.createTrue()
                    ),
                    `expected true`,
                    `f${visitorContext.functionMap.size}`
                )
            );
        } else if (intrinsicName === 'false') {
            visitorContext.functionMap.set(
                type,
                createAssertionFunction(
                    ts.createStrictInequality(
                        objectIdentifier,
                        ts.createFalse()
                    ),
                    `expected false`,
                    `f${visitorContext.functionMap.size}`
                )
            );
        } else {
            throw new Error(`Unsupported boolean literal with intrinsic name: ${intrinsicName}.`);
        }
    }
    return visitorContext.functionMap.get(type)!;
}

function visitNonPrimitiveType(type: ts.Type, visitorContext: VisitorContext) {
    if (!visitorContext.functionMap.has(type)) {
        // Using internal TypeScript API, hacky.
        const intrinsicName: string | undefined = (type as { intrinsicName?: string }).intrinsicName;
        if (intrinsicName === 'object') {
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
                type,
                createAssertionFunction(
                    ts.createLogicalNot(condition),
                    `expected a non-primitive`,
                    `f${visitorContext.functionMap.size}`
                )
            );
        } else {
            throw new Error(`Unsupported non-primitive with intrinsic name: ${intrinsicName}.`);
        }
    }
    return visitorContext.functionMap.get(type)!;
}

function visitAny(type: ts.Type, visitorContext: VisitorContext) {
    if (!visitorContext.functionMap.has(type)) {
        visitorContext.functionMap.set(
            type,
            createAcceptingFunction(`f${visitorContext.functionMap.size}`)
        );
    }
    return visitorContext.functionMap.get(type)!;
}

function visitUnknown(type: ts.Type, visitorContext: VisitorContext) {
    if (!visitorContext.functionMap.has(type)) {
        visitorContext.functionMap.set(
            type,
            createAcceptingFunction(`f${visitorContext.functionMap.size}`)
        );
    }
    return visitorContext.functionMap.get(type)!;
}

function visitNever(type: ts.Type, visitorContext: VisitorContext) {
    if (!visitorContext.functionMap.has(type)) {
        visitorContext.functionMap.set(
            type,
            createRejectingFunction('type is never', `f${visitorContext.functionMap.size}`)
        );
    }
    return visitorContext.functionMap.get(type)!;
}

function visitNull(type: ts.Type, visitorContext: VisitorContext) {
    if (!visitorContext.functionMap.has(type)) {
        visitorContext.functionMap.set(
            type,
            createAssertionFunction(
                ts.createStrictInequality(
                    objectIdentifier,
                    ts.createNull()
                ),
                'expected null',
                `f${visitorContext.functionMap.size}`
            )
        );
    }
    return visitorContext.functionMap.get(type)!;
}

function visitUndefined(type: ts.Type, visitorContext: VisitorContext) {
    if (!visitorContext.functionMap.has(type)) {
        visitorContext.functionMap.set(
            type,
            createAssertionFunction(
                ts.createStrictInequality(
                    objectIdentifier,
                    ts.createIdentifier('undefined')
                ),
                'expected undefined',
                `f${visitorContext.functionMap.size}`
            )
        );
    }
    return visitorContext.functionMap.get(type)!;
}

function visitNumber(type: ts.Type, visitorContext: VisitorContext) {
    if (!visitorContext.functionMap.has(type)) {
        visitorContext.functionMap.set(
            type,
            createAssertionFunction(
                ts.createStrictInequality(
                    ts.createTypeOf(objectIdentifier),
                    ts.createStringLiteral('number')
                ),
                'expected a number',
                `f${visitorContext.functionMap.size}`
            )
        );
    }
    return visitorContext.functionMap.get(type)!;
}

function visitBigInt(type: ts.Type, visitorContext: VisitorContext) {
    if (!visitorContext.functionMap.has(type)) {
        visitorContext.functionMap.set(
            type,
            createAssertionFunction(
                ts.createStrictInequality(
                    ts.createTypeOf(objectIdentifier),
                    ts.createStringLiteral('bigint')
                ),
                'expected a bigint',
                `f${visitorContext.functionMap.size}`
            )
        );
    }
    return visitorContext.functionMap.get(type)!;
}

function visitBoolean(type: ts.Type, visitorContext: VisitorContext) {
    if (!visitorContext.functionMap.has(type)) {
        visitorContext.functionMap.set(
            type,
            createAssertionFunction(
                ts.createStrictInequality(
                    ts.createTypeOf(objectIdentifier),
                    ts.createStringLiteral('boolean')
                ),
                'expected a boolean',
                `f${visitorContext.functionMap.size}`
            )
        );
    }
    return visitorContext.functionMap.get(type)!;
}

function visitString(type: ts.Type, visitorContext: VisitorContext) {
    if (!visitorContext.functionMap.has(type)) {
        visitorContext.functionMap.set(
            type,
            createAssertionFunction(
                ts.createStrictInequality(
                    ts.createTypeOf(objectIdentifier),
                    ts.createStringLiteral('string')
                ),
                `expected a string`,
                `f${visitorContext.functionMap.size}`
            )
        );
    }
    return visitorContext.functionMap.get(type)!;
}

export function visitType(type: ts.Type, visitorContext: VisitorContext): ts.FunctionDeclaration {
    if ((ts.TypeFlags.Any & type.flags) !== 0) {
        // Any
        return visitAny(type, visitorContext);
    } else if ((ts.TypeFlags.Unknown & type.flags) !== 0) {
        // Unknown
        return visitUnknown(type, visitorContext);
    } else if ((ts.TypeFlags.Never & type.flags) !== 0) {
        // Never
        return visitNever(type, visitorContext);
    } else if ((ts.TypeFlags.Null & type.flags) !== 0) {
        // Null
        return visitNull(type, visitorContext);
    } else if ((ts.TypeFlags.Undefined & type.flags) !== 0) {
        // Undefined
        return visitUndefined(type, visitorContext);
    } else if ((ts.TypeFlags.Number & type.flags) !== 0) {
        // Number
        return visitNumber(type, visitorContext);
    } else if ((ts.TypeFlags.BigInt & type.flags) !== 0) {
        // BigInt
        return visitBigInt(type, visitorContext);
    } else if ((ts.TypeFlags.Boolean & type.flags) !== 0) {
        // Boolean
        return visitBoolean(type, visitorContext);
    } else if ((ts.TypeFlags.String & type.flags) !== 0) {
        // String
        return visitString(type, visitorContext);
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
