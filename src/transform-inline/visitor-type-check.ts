import * as ts from 'typescript';
import * as tsutils from 'tsutils/typeguard/3.0';
import { VisitorContext } from './visitor-context';
import * as VisitorUtils from './visitor-utils';
import * as VisitorKeyof from './visitor-keyof';
import * as VisitorIndexedAccess from './visitor-indexed-access';
import * as VisitorIsStringKeyof from './visitor-is-string-keyof';
import * as VisitorTypeName from './visitor-type-name';
import { sliceSet,isPrimitive } from './utils';

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
                        ts.createReturn(VisitorUtils.createErrorObject({ type: 'date' }, visitorContext)),
                        ts.createReturn(ts.createNull())
                    )],
                true
            )
        )
    });
}

function createRecursiveCall(functionName: string, functionArgument: ts.Expression, pathExpression: ts.Expression, visitorContext: VisitorContext): ts.Statement[] {
    const errorIdentifier = ts.createIdentifier('error');
    const emitDetailedErrors = !!visitorContext.options.emitDetailedErrors;

    const statements: ts.Statement[] = [];
    if (emitDetailedErrors) {
        statements.push(ts.createExpressionStatement(
            ts.createCall(
                ts.createPropertyAccess(VisitorUtils.pathIdentifier, 'push'),
                undefined,
                [
                    VisitorUtils.createBinaries(
                        [
                            pathExpression
                        ],
                        ts.SyntaxKind.PlusToken
                    )
                ]
            )
        ));
    }
    statements.push(ts.createVariableStatement(
        [ts.createModifier(ts.SyntaxKind.ConstKeyword)],
        [
            ts.createVariableDeclaration(
                errorIdentifier,
                undefined,
                ts.createCall(
                    ts.createIdentifier(functionName),
                    undefined,
                    [functionArgument]
                )
            )
        ]
    ));
    if (emitDetailedErrors) {
        statements.push(ts.createExpressionStatement(
            ts.createCall(
                ts.createPropertyAccess(VisitorUtils.pathIdentifier, 'pop'),
                undefined,
                undefined
            )
        ));
    }
    statements.push(ts.createIf(
        errorIdentifier,
        ts.createReturn(errorIdentifier)
    ));
    return statements;
}

function visitTupleObjectType(type: ts.TupleType, visitorContext: VisitorContext) {
    const name = VisitorTypeName.visitType(type, visitorContext, { type: 'type-check' });
    return VisitorUtils.setFunctionIfNotExists(name, visitorContext, () => {
        const functionNames = type.typeArguments ?
            type.typeArguments.map((type) => visitType(type, visitorContext))
            : [];

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
                    ts.createReturn(VisitorUtils.createErrorObject({ type: 'tuple', minLength, maxLength }, visitorContext))
                ),
                ...functionNames.map((functionName, index) =>
                    ts.createBlock(createRecursiveCall(
                        functionName,
                        ts.createElementAccess(VisitorUtils.objectIdentifier, index),
                        ts.createStringLiteral(`[${index}]`),
                        visitorContext
                    ))
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
                    ts.createReturn(VisitorUtils.createErrorObject({ type: 'array' }, visitorContext))
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
                    ts.createBlock(
                        createRecursiveCall(
                            functionName,
                            ts.createElementAccess(VisitorUtils.objectIdentifier, indexIdentifier),
                            VisitorUtils.createBinaries(
                                [
                                    ts.createStringLiteral('['),
                                    indexIdentifier,
                                    ts.createStringLiteral(']')
                                ],
                                ts.SyntaxKind.PlusToken
                            ),
                            visitorContext
                        )
                    )
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
                    ts.createReturn(VisitorUtils.createErrorObject({ type: 'object' }, visitorContext))
                ),
                ...propertyInfos.map((propertyInfo) => {
                    if (propertyInfo.isSymbol) {
                        return ts.createEmptyStatement();
                    }
                    const functionName = propertyInfo.isMethod
                        ? VisitorUtils.getIgnoredTypeFunction(visitorContext)
                        : (propertyInfo.isFunction
                            ? (visitorContext.options.functionBehavior === 'basic'
                                ? VisitorUtils.getFunctionFunction(visitorContext)
                                : VisitorUtils.getIgnoredTypeFunction(visitorContext)
                            )
                            : visitType(propertyInfo.type!, visitorContext)
                        );
                    return ts.createBlock([
                        ts.createIf(
                            ts.createBinary(
                                ts.createStringLiteral(propertyInfo.name),
                                ts.SyntaxKind.InKeyword,
                                VisitorUtils.objectIdentifier
                            ),
                            ts.createBlock(
                                createRecursiveCall(
                                    functionName,
                                    ts.createElementAccess(VisitorUtils.objectIdentifier, ts.createStringLiteral(propertyInfo.name)),
                                    ts.createStringLiteral(propertyInfo.name),
                                    visitorContext
                                )
                            ),
                            propertyInfo.optional
                                ? undefined
                                : ts.createReturn(VisitorUtils.createErrorObject({ type: 'missing-property', property: propertyInfo.name }, visitorContext))
                        )
                    ]);
                }),
                ...(
                    visitorContext.options.disallowSuperfluousObjectProperties && stringIndexFunctionName === undefined
                        ? [VisitorUtils.createSuperfluousPropertiesLoop(propertyInfos.map((propertyInfo) => propertyInfo.name), visitorContext)]
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
                                ts.createBlock(
                                    createRecursiveCall(
                                        stringIndexFunctionName,
                                        ts.createElementAccess(VisitorUtils.objectIdentifier, keyIdentifier),
                                        keyIdentifier,
                                        visitorContext
                                    )
                                )
                            )
                        ]
                        : []
                ),
                ts.createReturn(ts.createNull())
            ])
        );
    });
}

function visitTypeAliasReference(type: ts.TypeReference, visitorContext: VisitorContext) {
    const mapping: Map<ts.Type, ts.Type> = VisitorUtils.getTypeAliasMapping(type);
    const previousTypeReference = visitorContext.previousTypeReference;
    visitorContext.typeMapperStack.push(mapping);
    visitorContext.previousTypeReference = type;
    const result = visitType(type, visitorContext);
    visitorContext.previousTypeReference = previousTypeReference;
    visitorContext.typeMapperStack.pop();
    return result;
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

function visitFunctionType(type: ts.Type, visitorContext: VisitorContext) {
    if (visitorContext.options.functionBehavior === 'error') {
        throw new Error('Encountered a function declaration, but functions are not supported. Issue: https://github.com/woutervh-/typescript-is/issues/50');
    } else if (visitorContext.options.functionBehavior === 'basic') {
        return VisitorUtils.getFunctionFunction(visitorContext);
    } else {
        return VisitorUtils.getIgnoredTypeFunction(visitorContext);
    }
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
        if (visitorContext.options.functionBehavior === 'ignore') {
            return VisitorUtils.getIgnoredTypeFunction(visitorContext);
        } else if (visitorContext.options.functionBehavior === 'basic') {
            return VisitorUtils.getFunctionFunction(visitorContext);
        } else {
            throw new Error('Encountered a function declaration, but functions are not supported. Issue: https://github.com/woutervh-/typescript-is/issues/50');
        }
    } else if (type.symbol && type.symbol.declarations && type.symbol.declarations.length >= 1 && ts.isFunctionTypeNode(type.symbol.declarations[0])) {
        return visitFunctionType(type, visitorContext);
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
                visitorContext,
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
                visitorContext,
                VisitorUtils.createStrictNullCheckStatement(VisitorUtils.objectIdentifier, visitorContext)
            );
        });
    } else {
        throw new Error('Type value is expected to be a string or number.');
    }
}

function visitUnionOrIntersectionType(type: ts.UnionOrIntersectionType, visitorContext: VisitorContext) {
    let disallowSuperfluousPropertyCheck = visitorContext.options.disallowSuperfluousObjectProperties;
    if (visitorContext.overrideDisallowSuperfluousObjectProperies) {
        visitorContext.overrideDisallowSuperfluousObjectProperies = false;
        disallowSuperfluousPropertyCheck = false;
    }
    const typeUnion = type;
    if (tsutils.isUnionType(typeUnion)) {
        const name = VisitorTypeName.visitType(type, visitorContext, { type: 'type-check' });
        const functionNames = typeUnion.types.map((type) => visitType(type, visitorContext));
        return VisitorUtils.setFunctionIfNotExists(name, visitorContext, () => {
            return VisitorUtils.createDisjunctionFunction(functionNames, name, visitorContext);
        });
    }
    const intersectionType = type;
    if (tsutils.isIntersectionType(intersectionType)) {
        const name = VisitorTypeName.visitType(type, visitorContext, { type: 'type-check', superfluousPropertyCheck: visitorContext.options.disallowSuperfluousObjectProperties });
        return VisitorUtils.setFunctionIfNotExists(name, visitorContext, () => {
            let functionNames: string[] = [];
            if (
              intersectionType.types.length === 2 &&
              ((intersectionType.types[0].flags & ts.TypeFlags.Object &&
                isPrimitive(intersectionType.types[1].flags)) ||
                (isPrimitive(intersectionType.types[0].flags) &&
                  intersectionType.types[1].flags & ts.TypeFlags.Object))
            ) {
              intersectionType.types.forEach((type) => {
                if (isPrimitive(type.flags)) {
                  functionNames.push(
                    visitType(
                      type,
                      Object.assign(Object.assign({}, visitorContext), {
                        overrideDisallowSuperfluousObjectProperies: true
                      })
                    )
                  );
                }
              });
            } else {
              functionNames = intersectionType.types.map((type) =>
                visitType(
                  type,
                  Object.assign(Object.assign({}, visitorContext), {
                    overrideDisallowSuperfluousObjectProperies: true
                  })
                )
              );
            }            if (disallowSuperfluousPropertyCheck) {
                // Check object keys at intersection type level. https://github.com/woutervh-/typescript-is/issues/21
                const keys = VisitorIsStringKeyof.visitType(type, visitorContext);
                if (keys instanceof Set) {
                    const loop = VisitorUtils.createSuperfluousPropertiesLoop(sliceSet(keys), visitorContext);
                    return VisitorUtils.createConjunctionFunction(functionNames, name, [loop]);
                }
            }
            return VisitorUtils.createConjunctionFunction(functionNames, name);
        });
    }
    throw new Error('UnionOrIntersectionType type was neither a union nor an intersection.');
}

function visitBooleanLiteral(type: ts.Type, visitorContext: VisitorContext) {
    const intrinsicName = VisitorUtils.getIntrinsicName(type)
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
                visitorContext,
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
                visitorContext,
                VisitorUtils.createStrictNullCheckStatement(VisitorUtils.objectIdentifier, visitorContext)
            );
        });
    } else {
        throw new Error(`Unsupported boolean literal with intrinsic name: ${intrinsicName}.`);
    }
}

function visitNonPrimitiveType(type: ts.Type, visitorContext: VisitorContext) {
    const intrinsicName = VisitorUtils.getIntrinsicName(type)
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
                visitorContext,
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

function visitTemplateLiteralType(type: ts.TemplateLiteralType, visitorContext: VisitorContext) {
    const name = VisitorTypeName.visitType(type, visitorContext, {type: 'type-check'});
    const typePairs = type.texts.reduce((prev, curr, i: number) =>
            [...prev, [curr, typeof type.types[i] === 'undefined' ? undefined : VisitorUtils.getIntrinsicName(type.types[i])]] as never,
        [] as VisitorUtils.TemplateLiteralPair[]
    )
    const templateLiteralTypeError = VisitorUtils.createErrorObject({
        type: 'template-literal',
        value: typePairs
    }, visitorContext)
    return VisitorUtils.setFunctionIfNotExists(name, visitorContext, () => ts.factory.createFunctionDeclaration(
        undefined,
        undefined,
        undefined,
        name,
        undefined,
        [
            ts.factory.createParameterDeclaration(
                undefined,
                undefined,
                undefined,
                VisitorUtils.objectIdentifier,
                undefined,
                ts.factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
                undefined
            )
        ],
        undefined,
        ts.factory.createBlock(
            [
                ts.factory.createVariableStatement(
                    undefined,
                    ts.factory.createVariableDeclarationList(
                        [ts.factory.createVariableDeclaration(
                            ts.factory.createIdentifier('typePairs'),
                            undefined,
                            undefined,
                            ts.factory.createArrayLiteralExpression(
                                typePairs.map(([text, type]) =>
                                    ts.factory.createArrayLiteralExpression(
                                        [
                                            ts.factory.createStringLiteral(text),
                                            typeof type === 'undefined'
                                                ? ts.factory.createIdentifier('undefined')
                                                : ts.factory.createStringLiteral(type)
                                        ]
                                    )
                                ),
                                false
                            )
                        )],
                        ts.NodeFlags.Const
                    )
                ),
                ts.factory.createVariableStatement(
                    undefined,
                    ts.factory.createVariableDeclarationList(
                        [ts.factory.createVariableDeclaration(
                            ts.factory.createIdentifier('position'),
                            undefined,
                            undefined,
                            ts.factory.createNumericLiteral('0')
                        )],
                        ts.NodeFlags.Let
                    )
                ),
                ts.factory.createForOfStatement(
                    undefined,
                    ts.factory.createVariableDeclarationList(
                        [ts.factory.createVariableDeclaration(
                            ts.factory.createArrayBindingPattern([
                                ts.factory.createBindingElement(
                                    undefined,
                                    undefined,
                                    ts.factory.createIdentifier('index'),
                                    undefined
                                ),
                                ts.factory.createBindingElement(
                                    undefined,
                                    undefined,
                                    ts.factory.createIdentifier('typePair'),
                                    undefined
                                )
                            ]),
                            undefined,
                            undefined,
                            undefined
                        )],
                        ts.NodeFlags.Const
                    ),
                    ts.factory.createCallExpression(
                        ts.factory.createPropertyAccessExpression(
                            ts.factory.createIdentifier('typePairs'),
                            ts.factory.createIdentifier('entries')
                        ),
                        undefined,
                        []
                    ),
                    ts.factory.createBlock(
                        [
                            ts.factory.createVariableStatement(
                                undefined,
                                ts.factory.createVariableDeclarationList(
                                    [ts.factory.createVariableDeclaration(
                                        ts.factory.createArrayBindingPattern([
                                            ts.factory.createBindingElement(
                                                undefined,
                                                undefined,
                                                ts.factory.createIdentifier('currentText'),
                                                undefined
                                            ),
                                            ts.factory.createBindingElement(
                                                undefined,
                                                undefined,
                                                ts.factory.createIdentifier('currentType'),
                                                undefined
                                            )
                                        ]),
                                        undefined,
                                        undefined,
                                        ts.factory.createIdentifier('typePair')
                                    )],
                                    ts.NodeFlags.Const
                                )
                            ),
                            ts.factory.createVariableStatement(
                                undefined,
                                ts.factory.createVariableDeclarationList(
                                    [ts.factory.createVariableDeclaration(
                                        ts.factory.createArrayBindingPattern([
                                            ts.factory.createBindingElement(
                                                undefined,
                                                undefined,
                                                ts.factory.createIdentifier('nextText'),
                                                undefined
                                            ),
                                            ts.factory.createBindingElement(
                                                undefined,
                                                undefined,
                                                ts.factory.createIdentifier('nextType'),
                                                undefined
                                            )
                                        ]),
                                        undefined,
                                        undefined,
                                        ts.factory.createBinaryExpression(
                                            ts.factory.createElementAccessExpression(
                                                ts.factory.createIdentifier('typePairs'),
                                                ts.factory.createBinaryExpression(
                                                    ts.factory.createIdentifier('index'),
                                                    ts.factory.createToken(ts.SyntaxKind.PlusToken),
                                                    ts.factory.createNumericLiteral('1')
                                                )
                                            ),
                                            ts.factory.createToken(ts.SyntaxKind.QuestionQuestionToken),
                                            ts.factory.createArrayLiteralExpression(
                                                [
                                                    ts.factory.createIdentifier('undefined'),
                                                    ts.factory.createIdentifier('undefined')
                                                ],
                                                false
                                            )
                                        )
                                    )],
                                    ts.NodeFlags.Const
                                )
                            ),
                            ts.factory.createIfStatement(
                                ts.factory.createBinaryExpression(
                                    ts.factory.createCallExpression(
                                        ts.factory.createPropertyAccessExpression(
                                            VisitorUtils.objectIdentifier,
                                            ts.factory.createIdentifier('substr')
                                        ),
                                        undefined,
                                        [
                                            ts.factory.createIdentifier('position'),
                                            ts.factory.createPropertyAccessExpression(
                                                ts.factory.createIdentifier('currentText'),
                                                ts.factory.createIdentifier('length')
                                            )
                                        ]
                                    ),
                                    ts.factory.createToken(ts.SyntaxKind.ExclamationEqualsEqualsToken),
                                    ts.factory.createIdentifier('currentText')
                                ),
                                ts.factory.createReturnStatement(templateLiteralTypeError),
                                undefined
                            ),
                            ts.factory.createExpressionStatement(ts.factory.createBinaryExpression(
                                ts.factory.createIdentifier('position'),
                                ts.factory.createToken(ts.SyntaxKind.PlusEqualsToken),
                                ts.factory.createPropertyAccessExpression(
                                    ts.factory.createIdentifier('currentText'),
                                    ts.factory.createIdentifier('length')
                                )
                            )),
                            ts.factory.createIfStatement(
                                ts.factory.createBinaryExpression(
                                    ts.factory.createBinaryExpression(
                                        ts.factory.createIdentifier('nextText'),
                                        ts.factory.createToken(ts.SyntaxKind.EqualsEqualsEqualsToken),
                                        ts.factory.createStringLiteral('')
                                    ),
                                    ts.factory.createToken(ts.SyntaxKind.AmpersandAmpersandToken),
                                    ts.factory.createBinaryExpression(
                                        ts.factory.createIdentifier('nextType'),
                                        ts.factory.createToken(ts.SyntaxKind.ExclamationEqualsEqualsToken),
                                        ts.factory.createIdentifier('undefined')
                                    )
                                ),
                                ts.factory.createBlock(
                                    [
                                        ts.factory.createVariableStatement(
                                            undefined,
                                            ts.factory.createVariableDeclarationList(
                                                [ts.factory.createVariableDeclaration(
                                                    ts.factory.createIdentifier('char'),
                                                    undefined,
                                                    undefined,
                                                    ts.factory.createCallExpression(
                                                        ts.factory.createPropertyAccessExpression(
                                                            VisitorUtils.objectIdentifier,
                                                            ts.factory.createIdentifier('charAt')
                                                        ),
                                                        undefined,
                                                        [ts.factory.createIdentifier('position')]
                                                    )
                                                )],
                                                ts.NodeFlags.Const
                                            )
                                        ),
                                        ts.factory.createIfStatement(
                                            ts.factory.createBinaryExpression(
                                                ts.factory.createParenthesizedExpression(ts.factory.createBinaryExpression(
                                                    ts.factory.createParenthesizedExpression(ts.factory.createBinaryExpression(
                                                        ts.factory.createBinaryExpression(
                                                            ts.factory.createIdentifier('currentType'),
                                                            ts.factory.createToken(ts.SyntaxKind.EqualsEqualsEqualsToken),
                                                            ts.factory.createStringLiteral('number')
                                                        ),
                                                        ts.factory.createToken(ts.SyntaxKind.BarBarToken),
                                                        ts.factory.createBinaryExpression(
                                                            ts.factory.createIdentifier('currentType'),
                                                            ts.factory.createToken(ts.SyntaxKind.EqualsEqualsEqualsToken),
                                                            ts.factory.createStringLiteral('bigint')
                                                        )
                                                    )),
                                                    ts.factory.createToken(ts.SyntaxKind.AmpersandAmpersandToken),
                                                    ts.factory.createCallExpression(
                                                        ts.factory.createIdentifier('isNaN'),
                                                        undefined,
                                                        [ts.factory.createCallExpression(
                                                            ts.factory.createIdentifier('Number'),
                                                            undefined,
                                                            [ts.factory.createIdentifier('char')]
                                                        )]
                                                    )
                                                )),
                                                ts.factory.createToken(ts.SyntaxKind.BarBarToken),
                                                ts.factory.createParenthesizedExpression(ts.factory.createBinaryExpression(
                                                    ts.factory.createParenthesizedExpression(ts.factory.createBinaryExpression(
                                                        ts.factory.createBinaryExpression(
                                                            ts.factory.createIdentifier('currentType'),
                                                            ts.factory.createToken(ts.SyntaxKind.EqualsEqualsEqualsToken),
                                                            ts.factory.createStringLiteral('string')
                                                        ),
                                                        ts.factory.createToken(ts.SyntaxKind.BarBarToken),
                                                        ts.factory.createBinaryExpression(
                                                            ts.factory.createIdentifier('currentType'),
                                                            ts.factory.createToken(ts.SyntaxKind.EqualsEqualsEqualsToken),
                                                            ts.factory.createStringLiteral('any')
                                                        )
                                                    )),
                                                    ts.factory.createToken(ts.SyntaxKind.AmpersandAmpersandToken),
                                                    ts.factory.createBinaryExpression(
                                                        ts.factory.createIdentifier('char'),
                                                        ts.factory.createToken(ts.SyntaxKind.EqualsEqualsEqualsToken),
                                                        ts.factory.createStringLiteral('')
                                                    )
                                                ))
                                            ),
                                            ts.factory.createReturnStatement(templateLiteralTypeError),
                                            undefined
                                        )
                                    ],
                                    true
                                ),
                                undefined
                            ),
                            ts.factory.createVariableStatement(
                                undefined,
                                ts.factory.createVariableDeclarationList(
                                    [ts.factory.createVariableDeclaration(
                                        ts.factory.createIdentifier('nextTextOrType'),
                                        undefined,
                                        undefined,
                                        ts.factory.createConditionalExpression(
                                            ts.factory.createBinaryExpression(
                                                ts.factory.createIdentifier('nextText'),
                                                ts.factory.createToken(ts.SyntaxKind.EqualsEqualsEqualsToken),
                                                ts.factory.createStringLiteral('')
                                            ),
                                            ts.factory.createToken(ts.SyntaxKind.QuestionToken),
                                            ts.factory.createIdentifier('nextType'),
                                            ts.factory.createToken(ts.SyntaxKind.ColonToken),
                                            ts.factory.createIdentifier('nextText')
                                        )
                                    )],
                                    ts.NodeFlags.Const
                                )
                            ),
                            ts.factory.createVariableStatement(
                                undefined,
                                ts.factory.createVariableDeclarationList(
                                    [ts.factory.createVariableDeclaration(
                                        ts.factory.createIdentifier('resolvedPlaceholder'),
                                        undefined,
                                        undefined,
                                        ts.factory.createCallExpression(
                                            ts.factory.createPropertyAccessExpression(
                                                VisitorUtils.objectIdentifier,
                                                ts.factory.createIdentifier('substring')
                                            ),
                                            undefined,
                                            [
                                                ts.factory.createIdentifier('position'),
                                                ts.factory.createConditionalExpression(
                                                    ts.factory.createBinaryExpression(
                                                        ts.factory.createTypeOfExpression(ts.factory.createIdentifier('nextTextOrType')),
                                                        ts.factory.createToken(ts.SyntaxKind.EqualsEqualsEqualsToken),
                                                        ts.factory.createStringLiteral('undefined')
                                                    ),
                                                    ts.factory.createToken(ts.SyntaxKind.QuestionToken),
                                                    ts.factory.createBinaryExpression(
                                                        ts.factory.createPropertyAccessExpression(
                                                            VisitorUtils.objectIdentifier,
                                                            ts.factory.createIdentifier('length')
                                                        ),
                                                        ts.factory.createToken(ts.SyntaxKind.MinusToken),
                                                        ts.factory.createNumericLiteral('1')
                                                    ),
                                                    ts.factory.createToken(ts.SyntaxKind.ColonToken),
                                                    ts.factory.createCallExpression(
                                                        ts.factory.createPropertyAccessExpression(
                                                            VisitorUtils.objectIdentifier,
                                                            ts.factory.createIdentifier('indexOf')
                                                        ),
                                                        undefined,
                                                        [
                                                            ts.factory.createIdentifier('nextTextOrType'),
                                                            ts.factory.createIdentifier('position')
                                                        ]
                                                    )
                                                )
                                            ]
                                        )
                                    )],
                                    ts.NodeFlags.Const
                                )
                            ),
                            ts.factory.createIfStatement(
                                ts.factory.createBinaryExpression(
                                    ts.factory.createBinaryExpression(
                                        ts.factory.createBinaryExpression(
                                            ts.factory.createParenthesizedExpression(ts.factory.createBinaryExpression(
                                                ts.factory.createBinaryExpression(
                                                    ts.factory.createIdentifier('currentType'),
                                                    ts.factory.createToken(ts.SyntaxKind.EqualsEqualsEqualsToken),
                                                    ts.factory.createStringLiteral('number')
                                                ),
                                                ts.factory.createToken(ts.SyntaxKind.AmpersandAmpersandToken),
                                                ts.factory.createCallExpression(
                                                    ts.factory.createIdentifier('isNaN'),
                                                    undefined,
                                                    [ts.factory.createCallExpression(
                                                        ts.factory.createIdentifier('Number'),
                                                        undefined,
                                                        [ts.factory.createIdentifier('resolvedPlaceholder')]
                                                    )]
                                                )
                                            )),
                                            ts.factory.createToken(ts.SyntaxKind.BarBarToken),
                                            ts.factory.createParenthesizedExpression(ts.factory.createBinaryExpression(
                                                ts.factory.createBinaryExpression(
                                                    ts.factory.createIdentifier('currentType'),
                                                    ts.factory.createToken(ts.SyntaxKind.EqualsEqualsEqualsToken),
                                                    ts.factory.createStringLiteral('bigint')
                                                ),
                                                ts.factory.createToken(ts.SyntaxKind.AmpersandAmpersandToken),
                                                ts.factory.createParenthesizedExpression(ts.factory.createBinaryExpression(
                                                    ts.factory.createCallExpression(
                                                        ts.factory.createPropertyAccessExpression(
                                                            ts.factory.createIdentifier('resolvedPlaceholder'),
                                                            ts.factory.createIdentifier('includes')
                                                        ),
                                                        undefined,
                                                        [ts.factory.createStringLiteral('.')]
                                                    ),
                                                    ts.factory.createToken(ts.SyntaxKind.BarBarToken),
                                                    ts.factory.createCallExpression(
                                                        ts.factory.createIdentifier('isNaN'),
                                                        undefined,
                                                        [ts.factory.createCallExpression(
                                                            ts.factory.createIdentifier('Number'),
                                                            undefined,
                                                            [ts.factory.createIdentifier('resolvedPlaceholder')]
                                                        )]
                                                    )
                                                ))
                                            ))
                                        ),
                                        ts.factory.createToken(ts.SyntaxKind.BarBarToken),
                                        ts.factory.createParenthesizedExpression(ts.factory.createBinaryExpression(
                                            ts.factory.createBinaryExpression(
                                                ts.factory.createIdentifier('currentType'),
                                                ts.factory.createToken(ts.SyntaxKind.EqualsEqualsEqualsToken),
                                                ts.factory.createStringLiteral('undefined')
                                            ),
                                            ts.factory.createToken(ts.SyntaxKind.AmpersandAmpersandToken),
                                            ts.factory.createBinaryExpression(
                                                ts.factory.createIdentifier('resolvedPlaceholder'),
                                                ts.factory.createToken(ts.SyntaxKind.ExclamationEqualsEqualsToken),
                                                ts.factory.createStringLiteral('undefined')
                                            )
                                        ))
                                    ),
                                    ts.factory.createToken(ts.SyntaxKind.BarBarToken),
                                    ts.factory.createParenthesizedExpression(ts.factory.createBinaryExpression(
                                        ts.factory.createBinaryExpression(
                                            ts.factory.createIdentifier('currentType'),
                                            ts.factory.createToken(ts.SyntaxKind.EqualsEqualsEqualsToken),
                                            ts.factory.createStringLiteral('null')
                                        ),
                                        ts.factory.createToken(ts.SyntaxKind.AmpersandAmpersandToken),
                                        ts.factory.createBinaryExpression(
                                            ts.factory.createIdentifier('resolvedPlaceholder'),
                                            ts.factory.createToken(ts.SyntaxKind.ExclamationEqualsEqualsToken),
                                            ts.factory.createStringLiteral('null')
                                        )
                                    ))
                                ),
                                ts.factory.createReturnStatement(templateLiteralTypeError),
                                undefined
                            ),
                            ts.factory.createExpressionStatement(ts.factory.createBinaryExpression(
                                ts.factory.createIdentifier('position'),
                                ts.factory.createToken(ts.SyntaxKind.PlusEqualsToken),
                                ts.factory.createPropertyAccessExpression(
                                    ts.factory.createIdentifier('resolvedPlaceholder'),
                                    ts.factory.createIdentifier('length')
                                )
                            ))
                        ],
                        true
                    )
                ),
                ts.factory.createReturnStatement(ts.factory.createNull())
            ],
            true
        )
    ))
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
    } else if (type.aliasTypeArguments && visitorContext.previousTypeReference !== type && (type as ts.TypeReference).target) {
        return visitTypeAliasReference(type as ts.TypeReference, visitorContext);
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
    } else if ((ts.TypeFlags.TemplateLiteral & type.flags) !== 0) {
        // template literal type: `foo${string}`
        return visitTemplateLiteralType(type as ts.TemplateLiteralType, visitorContext)
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
