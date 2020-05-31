import * as ts from 'typescript';
import * as tsutils from 'tsutils/typeguard/3.0';
import { VisitorContext } from './visitor-context';
import * as VisitorUtils from './visitor-utils';
import * as VisitorKeyof from './visitor-keyof';
import * as VisitorIndexedAccess from './visitor-indexed-access';
import * as VisitorIsStringKeyof from './visitor-is-string-keyof';
import * as VisitorTypeName from './visitor-type-name';
import { sliceSet } from './utils';

function visitDateType(type: ts.ObjectType, visitorContext: VisitorContext) {
    const name = VisitorTypeName.visitType(type, visitorContext, { type: 'type-check' });
    return VisitorUtils.setFunctionIfNotExists(name, visitorContext, () => {
        return ts.createFunctionDeclaration(
            undefined,
            undefined,
            undefined,
            name,
            undefined,
            [ts.createParameter(undefined, undefined, undefined, VisitorUtils.objectIdentifier, undefined, undefined, undefined)],
            undefined,
            ts.createBlock(
                [
                    ts.createVariableStatement(
                        undefined,
                        ts.createVariableDeclarationList(
                            [ts.createVariableDeclaration(
                                ts.createIdentifier('nativeDateObject'),
                                undefined,
                                undefined
                            )],
                            ts.NodeFlags.Let
                        )
                    ),
                    ts.createIf(
                        ts.createBinary(
                            ts.createTypeOf(ts.createIdentifier('global')),
                            ts.createToken(ts.SyntaxKind.EqualsEqualsEqualsToken),
                            ts.createStringLiteral('undefined')
                        ),
                        ts.createExpressionStatement(ts.createBinary(
                            ts.createIdentifier('nativeDateObject'),
                            ts.createToken(ts.SyntaxKind.EqualsToken),
                            ts.createPropertyAccess(
                                ts.createIdentifier('window'),
                                ts.createIdentifier('Date')
                            )
                        )),
                        ts.createExpressionStatement(ts.createBinary(
                            ts.createIdentifier('nativeDateObject'),
                            ts.createToken(ts.SyntaxKind.EqualsToken),
                            ts.createPropertyAccess(
                                ts.createIdentifier('global'),
                                ts.createIdentifier('Date')
                            )
                        ))
                    ),
                    ts.createIf(
                        ts.createLogicalNot(
                            ts.createBinary(
                                ts.createIdentifier('object'),
                                ts.createToken(ts.SyntaxKind.InstanceOfKeyword),
                                ts.createIdentifier('nativeDateObject')
                            )
                        ),
                        ts.createReturn(VisitorUtils.createErrorObject({ type: 'date' })),
                        ts.createReturn(ts.createNull())
                    )],
                true
            )
        )
    });
}

function visitTupleObjectType(type: ts.TupleType, visitorContext: VisitorContext) {
    const name = VisitorTypeName.visitType(type, visitorContext, { type: 'type-check' });
    return VisitorUtils.setFunctionIfNotExists(name, visitorContext, () => {
        const functionNames = type.typeArguments ?
            type.typeArguments.map((type) => visitType(type, visitorContext))
            : [];
        const errorIdentifier = ts.createIdentifier('error');

        const maxLength = functionNames.length;
        let minLength = functionNames.length;
        for (let i = 0; i < functionNames.length; i++) {
            const property = type.getProperty(i.toString());
            if (property && (property.flags & ts.SymbolFlags.Optional) !== 0) {
                minLength = i;
                break;
            }
        }

        return ts.createFunctionDeclaration(
            undefined,
            undefined,
            undefined,
            name,
            undefined,
            [
                ts.createParameter(undefined, undefined, undefined, VisitorUtils.objectIdentifier, undefined, undefined, undefined)
            ],
            undefined,
            ts.createBlock([
                VisitorUtils.createStrictNullCheckStatement(VisitorUtils.objectIdentifier, visitorContext),
                ts.createIf(
                    VisitorUtils.createBinaries(
                        [
                            ts.createLogicalNot(
                                ts.createCall(
                                    ts.createPropertyAccess(ts.createIdentifier('Array'), 'isArray'),
                                    undefined,
                                    [VisitorUtils.objectIdentifier]
                                )
                            ),
                            ts.createBinary(
                                ts.createPropertyAccess(
                                    VisitorUtils.objectIdentifier,
                                    'length'
                                ),
                                ts.SyntaxKind.LessThanToken,
                                ts.createNumericLiteral(minLength.toString())
                            ),
                            ts.createBinary(
                                ts.createNumericLiteral(maxLength.toString()),
                                ts.SyntaxKind.LessThanToken,
                                ts.createPropertyAccess(
                                    VisitorUtils.objectIdentifier,
                                    'length'
                                )
                            )
                        ],
                        ts.SyntaxKind.BarBarToken
                    ),
                    ts.createReturn(VisitorUtils.createErrorObject({ type: 'tuple', minLength, maxLength }))
                ),
                ...functionNames.map((functionName, index) =>
                    ts.createBlock([
                        ts.createExpressionStatement(
                            ts.createCall(
                                ts.createPropertyAccess(VisitorUtils.pathIdentifier, 'push'),
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
                                        ts.createIdentifier(functionName),
                                        undefined,
                                        [ts.createElementAccess(VisitorUtils.objectIdentifier, index)]
                                    )
                                )
                            ]
                        ),
                        ts.createExpressionStatement(
                            ts.createCall(
                                ts.createPropertyAccess(VisitorUtils.pathIdentifier, 'pop'),
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
        );
    });
}

function visitArrayObjectType(type: ts.ObjectType, visitorContext: VisitorContext) {
    const name = VisitorTypeName.visitType(type, visitorContext, { type: 'type-check' });
    return VisitorUtils.setFunctionIfNotExists(name, visitorContext, () => {
        const numberIndexType = visitorContext.checker.getIndexTypeOfType(type, ts.IndexKind.Number);
        if (numberIndexType === undefined) {
            throw new Error('Expected array ObjectType to have a number index type.');
        }
        const functionName = visitType(numberIndexType, visitorContext);
        const indexIdentifier = ts.createIdentifier('i');
        const errorIdentifier = ts.createIdentifier('error');
        return ts.createFunctionDeclaration(
            undefined,
            undefined,
            undefined,
            name,
            undefined,
            [
                ts.createParameter(undefined, undefined, undefined, VisitorUtils.objectIdentifier, undefined, undefined, undefined)
            ],
            undefined,
            ts.createBlock([
                VisitorUtils.createStrictNullCheckStatement(VisitorUtils.objectIdentifier, visitorContext),
                ts.createIf(
                    ts.createLogicalNot(
                        ts.createCall(
                            ts.createPropertyAccess(ts.createIdentifier('Array'), 'isArray'),
                            undefined,
                            [VisitorUtils.objectIdentifier]
                        )
                    ),
                    ts.createReturn(VisitorUtils.createErrorObject({ type: 'array' }))
                ),
                ts.createFor(
                    ts.createVariableDeclarationList(
                        [ts.createVariableDeclaration(indexIdentifier, undefined, ts.createNumericLiteral('0'))],
                        ts.NodeFlags.Let
                    ),
                    ts.createBinary(
                        indexIdentifier,
                        ts.SyntaxKind.LessThanToken,
                        ts.createPropertyAccess(VisitorUtils.objectIdentifier, 'length')
                    ),
                    ts.createPostfixIncrement(indexIdentifier),
                    ts.createBlock([
                        ts.createExpressionStatement(
                            ts.createCall(
                                ts.createPropertyAccess(VisitorUtils.pathIdentifier, 'push'),
                                undefined,
                                [
                                    VisitorUtils.createBinaries(
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
                                        ts.createIdentifier(functionName),
                                        undefined,
                                        [ts.createElementAccess(VisitorUtils.objectIdentifier, indexIdentifier)]
                                    )
                                )
                            ]
                        ),
                        ts.createExpressionStatement(
                            ts.createCall(
                                ts.createPropertyAccess(VisitorUtils.pathIdentifier, 'pop'),
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
        );
    });
}

function visitRegularObjectType(type: ts.ObjectType, visitorContext: VisitorContext) {
    const name = VisitorTypeName.visitType(type, visitorContext, { type: 'type-check', superfluousPropertyCheck: visitorContext.options.disallowSuperfluousObjectProperties });
    return VisitorUtils.setFunctionIfNotExists(name, visitorContext, () => {
        const propertyInfos = visitorContext.checker.getPropertiesOfType(type).map((property) => VisitorUtils.getPropertyInfo(type, property, visitorContext));
        const stringIndexType = visitorContext.checker.getIndexTypeOfType(type, ts.IndexKind.String);
        const stringIndexFunctionName = stringIndexType ? visitType(stringIndexType, visitorContext) : undefined;
        const keyIdentifier = ts.createIdentifier('key');
        const errorIdentifier = ts.createIdentifier('error');
        return ts.createFunctionDeclaration(
            undefined,
            undefined,
            undefined,
            name,
            undefined,
            [
                ts.createParameter(undefined, undefined, undefined, VisitorUtils.objectIdentifier, undefined, undefined, undefined)
            ],
            undefined,
            ts.createBlock([
                VisitorUtils.createStrictNullCheckStatement(VisitorUtils.objectIdentifier, visitorContext),
                ts.createIf(
                    VisitorUtils.createBinaries(
                        [
                            ts.createStrictInequality(
                                ts.createTypeOf(VisitorUtils.objectIdentifier),
                                ts.createStringLiteral('object')
                            ),
                            ts.createStrictEquality(
                                VisitorUtils.objectIdentifier,
                                ts.createNull()
                            ),
                            ts.createCall(
                                ts.createPropertyAccess(ts.createIdentifier('Array'), 'isArray'),
                                undefined,
                                [VisitorUtils.objectIdentifier]
                            )
                        ],
                        ts.SyntaxKind.BarBarToken
                    ),
                    ts.createReturn(VisitorUtils.createErrorObject({ type: 'object' }))
                ),
                ...propertyInfos.map((propertyInfo) => {
                    if (propertyInfo.isSymbol) {
                        return ts.createEmptyStatement();
                    }
                    const functionName = propertyInfo.isMethod
                        ? VisitorUtils.getIgnoredTypeFunction(visitorContext)
                        : visitType(propertyInfo.type!, visitorContext);
                    return ts.createBlock([
                        ts.createIf(
                            ts.createBinary(
                                ts.createStringLiteral(propertyInfo.name),
                                ts.SyntaxKind.InKeyword,
                                VisitorUtils.objectIdentifier
                            ),
                            ts.createBlock([
                                ts.createExpressionStatement(
                                    ts.createCall(
                                        ts.createPropertyAccess(VisitorUtils.pathIdentifier, 'push'),
                                        undefined,
                                        [ts.createStringLiteral(propertyInfo.name)]
                                    )
                                ),
                                ts.createVariableStatement(
                                    [ts.createModifier(ts.SyntaxKind.ConstKeyword)],
                                    [
                                        ts.createVariableDeclaration(
                                            errorIdentifier,
                                            undefined,
                                            ts.createCall(
                                                ts.createIdentifier(functionName),
                                                undefined,
                                                [ts.createElementAccess(VisitorUtils.objectIdentifier, ts.createStringLiteral(propertyInfo.name))]
                                            )
                                        )
                                    ]
                                ),
                                ts.createExpressionStatement(
                                    ts.createCall(
                                        ts.createPropertyAccess(VisitorUtils.pathIdentifier, 'pop'),
                                        undefined,
                                        undefined
                                    )
                                ),
                                ts.createIf(
                                    errorIdentifier,
                                    ts.createReturn(errorIdentifier)
                                )
                            ]),
                            propertyInfo.optional
                                ? undefined
                                : ts.createReturn(VisitorUtils.createErrorObject({ type: 'missing-property', property: propertyInfo.name }))
                        )
                    ]);
                }),
                ...(
                    visitorContext.options.disallowSuperfluousObjectProperties && stringIndexFunctionName === undefined
                        ? [VisitorUtils.createSuperfluousPropertiesLoop(propertyInfos.map((propertyInfo) => propertyInfo.name))]
                        : []
                ),
                ...(
                    stringIndexFunctionName
                        ? [
                            ts.createForOf(
                                undefined,
                                ts.createVariableDeclarationList(
                                    [ts.createVariableDeclaration(keyIdentifier, undefined, undefined)],
                                    ts.NodeFlags.Const
                                ),
                                ts.createCall(ts.createPropertyAccess(ts.createIdentifier('Object'), 'keys'), undefined, [VisitorUtils.objectIdentifier]),
                                ts.createBlock([
                                    ts.createExpressionStatement(
                                        ts.createCall(
                                            ts.createPropertyAccess(VisitorUtils.pathIdentifier, 'push'),
                                            undefined,
                                            [keyIdentifier]
                                        )
                                    ),
                                    ts.createVariableStatement(
                                        [ts.createModifier(ts.SyntaxKind.ConstKeyword)],
                                        [
                                            ts.createVariableDeclaration(
                                                errorIdentifier,
                                                undefined,
                                                ts.createCall(
                                                    ts.createIdentifier(stringIndexFunctionName),
                                                    undefined,
                                                    [ts.createElementAccess(VisitorUtils.objectIdentifier, keyIdentifier)]
                                                )
                                            )
                                        ]
                                    ),
                                    ts.createExpressionStatement(
                                        ts.createCall(
                                            ts.createPropertyAccess(VisitorUtils.pathIdentifier, 'pop'),
                                            undefined,
                                            undefined
                                        )
                                    ),
                                    ts.createIf(
                                        errorIdentifier,
                                        ts.createReturn(errorIdentifier)
                                    )
                                ])
                            )
                        ]
                        : []
                ),
                ts.createReturn(ts.createNull())
            ])
        );
    });
}

function visitTypeReference(type: ts.TypeReference, visitorContext: VisitorContext) {
    const mapping: Map<ts.Type, ts.Type> = VisitorUtils.getTypeReferenceMapping(type, visitorContext);
    const previousTypeReference = visitorContext.previousTypeReference;
    visitorContext.typeMapperStack.push(mapping);
    visitorContext.previousTypeReference = type;
    const result = visitType(type.target, visitorContext);
    visitorContext.previousTypeReference = previousTypeReference;
    visitorContext.typeMapperStack.pop();
    return result;
}

function visitTypeParameter(type: ts.Type, visitorContext: VisitorContext) {
    const mappedType = VisitorUtils.getResolvedTypeParameter(type, visitorContext);
    if (mappedType === undefined) {
        throw new Error('Unbound type parameter, missing type node.');
    }
    return visitType(mappedType, visitorContext);
}

function visitObjectType(type: ts.ObjectType, visitorContext: VisitorContext) {
    if (VisitorUtils.checkIsClass(type, visitorContext)) {
        // Dates
        if (VisitorUtils.checkIsDateClass(type)) {
            return visitDateType(type, visitorContext);
        }

        // all other classes
        if (visitorContext.options.ignoreClasses) {
            return VisitorUtils.getIgnoredTypeFunction(visitorContext);
        } else {
            throw new Error('Classes cannot be validated. https://github.com/woutervh-/typescript-is/issues/3');
        }
    }
    if (tsutils.isTupleType(type)) {
        // Tuple with finite length.
        return visitTupleObjectType(type, visitorContext);
    } else if (visitorContext.checker.getIndexTypeOfType(type, ts.IndexKind.Number)) {
        // Index type is number -> array type.
        return visitArrayObjectType(type, visitorContext);
    } else if ('valueDeclaration' in type.symbol
        && (type.symbol.valueDeclaration.kind === ts.SyntaxKind.MethodDeclaration || type.symbol.valueDeclaration.kind === ts.SyntaxKind.FunctionType)
    ) {
        if (visitorContext.options.ignoreFunctions) {
            return VisitorUtils.getIgnoredTypeFunction(visitorContext);
        } else {
            throw new Error('Encountered a function declaration, but functions are not supported. Issue: https://github.com/woutervh-/typescript-is/issues/50');
        }
    } else {
        // Index type is string -> regular object type.
        return visitRegularObjectType(type, visitorContext);
    }
}

function visitLiteralType(type: ts.LiteralType, visitorContext: VisitorContext) {
    if (typeof type.value === 'string') {
        const name = VisitorTypeName.visitType(type, visitorContext, { type: 'type-check' });
        const value = type.value;
        return VisitorUtils.setFunctionIfNotExists(name, visitorContext, () => {
            return VisitorUtils.createAssertionFunction(
                ts.createStrictInequality(
                    VisitorUtils.objectIdentifier,
                    ts.createStringLiteral(value)
                ),
                { type: 'string-literal', value },
                name,
                VisitorUtils.createStrictNullCheckStatement(VisitorUtils.objectIdentifier, visitorContext)
            );
        });
    } else if (typeof type.value === 'number') {
        const name = VisitorTypeName.visitType(type, visitorContext, { type: 'type-check' });
        const value = type.value;
        return VisitorUtils.setFunctionIfNotExists(name, visitorContext, () => {
            return VisitorUtils.createAssertionFunction(
                ts.createStrictInequality(
                    VisitorUtils.objectIdentifier,
                    ts.createNumericLiteral(value.toString())
                ),
                { type: 'number-literal', value },
                name,
                VisitorUtils.createStrictNullCheckStatement(VisitorUtils.objectIdentifier, visitorContext)
            );
        });
    } else {
        throw new Error('Type value is expected to be a string or number.');
    }
}

function visitUnionOrIntersectionType(type: ts.UnionOrIntersectionType, visitorContext: VisitorContext) {
    const typeUnion = type;
    if (tsutils.isUnionType(typeUnion)) {
        const name = VisitorTypeName.visitType(type, visitorContext, { type: 'type-check' });
        const functionNames = typeUnion.types.map((type) => visitType(type, visitorContext));
        return VisitorUtils.setFunctionIfNotExists(name, visitorContext, () => {
            return VisitorUtils.createDisjunctionFunction(functionNames, name);
        });
    }
    const intersectionType = type;
    if (tsutils.isIntersectionType(intersectionType)) {
        const name = VisitorTypeName.visitType(type, visitorContext, { type: 'type-check', superfluousPropertyCheck: visitorContext.options.disallowSuperfluousObjectProperties });
        return VisitorUtils.setFunctionIfNotExists(name, visitorContext, () => {
            const functionNames = intersectionType.types.map((type) => visitType(type, { ...visitorContext, options: { ...visitorContext.options, disallowSuperfluousObjectProperties: false } }));
            if (visitorContext.options.disallowSuperfluousObjectProperties) {
                // Check object keys at intersection type level. https://github.com/woutervh-/typescript-is/issues/21
                const keys = VisitorIsStringKeyof.visitType(type, visitorContext);
                if (keys instanceof Set) {
                    const loop = VisitorUtils.createSuperfluousPropertiesLoop(sliceSet(keys));
                    return VisitorUtils.createConjunctionFunction(functionNames, name, [loop]);
                }
            }
            return VisitorUtils.createConjunctionFunction(functionNames, name);
        });
    }
    throw new Error('UnionOrIntersectionType type was neither a union nor an intersection.');
}

function visitBooleanLiteral(type: ts.Type, visitorContext: VisitorContext) {
    // Using internal TypeScript API, hacky.
    const intrinsicName: string | undefined = (type as { intrinsicName?: string }).intrinsicName;
    if (intrinsicName === 'true') {
        const name = '_true';
        return VisitorUtils.setFunctionIfNotExists(name, visitorContext, () => {
            return VisitorUtils.createAssertionFunction(
                ts.createStrictInequality(
                    VisitorUtils.objectIdentifier,
                    ts.createTrue()
                ),
                { type: 'boolean-literal', value: true },
                name,
                VisitorUtils.createStrictNullCheckStatement(VisitorUtils.objectIdentifier, visitorContext)
            );
        });
    } else if (intrinsicName === 'false') {
        const name = '_false';
        return VisitorUtils.setFunctionIfNotExists(name, visitorContext, () => {
            return VisitorUtils.createAssertionFunction(
                ts.createStrictInequality(
                    VisitorUtils.objectIdentifier,
                    ts.createFalse()
                ),
                { type: 'boolean-literal', value: false },
                name,
                VisitorUtils.createStrictNullCheckStatement(VisitorUtils.objectIdentifier, visitorContext)
            );
        });
    } else {
        throw new Error(`Unsupported boolean literal with intrinsic name: ${intrinsicName}.`);
    }
}

function visitNonPrimitiveType(type: ts.Type, visitorContext: VisitorContext) {
    // Using internal TypeScript API, hacky.
    const intrinsicName: string | undefined = (type as { intrinsicName?: string }).intrinsicName;
    if (intrinsicName === 'object') {
        const name = '_object';
        return VisitorUtils.setFunctionIfNotExists(name, visitorContext, () => {
            const conditions: ts.Expression[] = [
                ts.createStrictInequality(
                    ts.createTypeOf(VisitorUtils.objectIdentifier),
                    ts.createStringLiteral('boolean')
                ),
                ts.createStrictInequality(
                    ts.createTypeOf(VisitorUtils.objectIdentifier),
                    ts.createStringLiteral('number')
                ),
                ts.createStrictInequality(
                    ts.createTypeOf(VisitorUtils.objectIdentifier),
                    ts.createStringLiteral('string')
                ),
                ts.createStrictInequality(
                    VisitorUtils.objectIdentifier,
                    ts.createNull()
                ),
                ts.createStrictInequality(
                    VisitorUtils.objectIdentifier,
                    ts.createIdentifier('undefined')
                )
            ];
            const condition = VisitorUtils.createBinaries(conditions, ts.SyntaxKind.AmpersandAmpersandToken);
            return VisitorUtils.createAssertionFunction(
                ts.createLogicalNot(condition),
                { type: 'non-primitive' },
                name,
                VisitorUtils.createStrictNullCheckStatement(VisitorUtils.objectIdentifier, visitorContext)
            );
        });
    } else {
        throw new Error(`Unsupported non-primitive with intrinsic name: ${intrinsicName}.`);
    }
}

function visitAny(visitorContext: VisitorContext) {
    return VisitorUtils.getAnyFunction(visitorContext);
}

function visitUnknown(visitorContext: VisitorContext) {
    return VisitorUtils.getUnknownFunction(visitorContext);
}

function visitNever(visitorContext: VisitorContext) {
    return VisitorUtils.getNeverFunction(visitorContext);
}

function visitNull(visitorContext: VisitorContext) {
    return VisitorUtils.getNullFunction(visitorContext);
}

function visitUndefined(visitorContext: VisitorContext) {
    return VisitorUtils.getUndefinedFunction(visitorContext);
}

function visitNumber(visitorContext: VisitorContext) {
    return VisitorUtils.getNumberFunction(visitorContext);
}

function visitBigInt(visitorContext: VisitorContext) {
    return VisitorUtils.getBigIntFunction(visitorContext);
}

function visitBoolean(visitorContext: VisitorContext) {
    return VisitorUtils.getBooleanFunction(visitorContext);
}

function visitString(visitorContext: VisitorContext) {
    return VisitorUtils.getStringFunction(visitorContext);
}

function visitIndexType(type: ts.Type, visitorContext: VisitorContext) {
    // keyof T
    const indexedType = (type as { type?: ts.Type }).type;
    if (indexedType === undefined) {
        throw new Error('Could not get indexed type of index type.');
    }
    return VisitorKeyof.visitType(indexedType, visitorContext);
}

function visitIndexedAccessType(type: ts.IndexedAccessType, visitorContext: VisitorContext) {
    // T[U] -> index type = U, object type = T
    return VisitorIndexedAccess.visitType(type.objectType, type.indexType, visitorContext);
}

export function visitType(type: ts.Type, visitorContext: VisitorContext): string {
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
    } else if (VisitorUtils.isBigIntType(type)) {
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
        return visitObjectType(type, visitorContext);
    } else if (tsutils.isLiteralType(type)) {
        // Literal string/number types ('foo')
        return visitLiteralType(type, visitorContext);
    } else if (tsutils.isUnionOrIntersectionType(type)) {
        // Union or intersection type (| or &)
        return visitUnionOrIntersectionType(type, visitorContext);
    } else if ((ts.TypeFlags.NonPrimitive & type.flags) !== 0) {
        // Non-primitive such as object
        return visitNonPrimitiveType(type, visitorContext);
    } else if ((ts.TypeFlags.Index & type.flags) !== 0) {
        // Index type: keyof T
        return visitIndexType(type, visitorContext);
    } else if (tsutils.isIndexedAccessType(type)) {
        // Indexed access type: T[U]
        return visitIndexedAccessType(type, visitorContext);
    } else {
        throw new Error('Could not generate type-check; unsupported type with flags: ' + type.flags);
    }
}

export function visitUndefinedOrType(type: ts.Type, visitorContext: VisitorContext) {
    const functionName = visitType(type, visitorContext);
    const name = `optional_${functionName}`;
    return VisitorUtils.setFunctionIfNotExists(name, visitorContext, () => {
        const errorIdentifier = ts.createIdentifier('error');
        return ts.createFunctionDeclaration(
            undefined,
            undefined,
            undefined,
            name,
            undefined,
            [
                ts.createParameter(undefined, undefined, undefined, VisitorUtils.objectIdentifier, undefined, undefined, undefined)
            ],
            undefined,
            ts.createBlock([
                ts.createIf(
                    ts.createStrictInequality(
                        VisitorUtils.objectIdentifier,
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
                                        ts.createIdentifier(functionName),
                                        undefined,
                                        [VisitorUtils.objectIdentifier]
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
    });
}

export function visitShortCircuit(visitorContext: VisitorContext) {
    return VisitorUtils.setFunctionIfNotExists('shortCircuit', visitorContext, () => {
        return VisitorUtils.createAcceptingFunction('shortCircuit');
    });
}
