import * as ts from 'typescript';
import * as tsutils from 'tsutils';
import { VisitorContext } from './visitor-context';
import * as VisitorUtils from './visitor-utils';
import * as VisitorKeyof from './visitor-keyof';
import * as VisitorIndexedAccess from './visitor-indexed-access';

const objectIdentifier = ts.createIdentifier('object');
const pathIdentifier = ts.createIdentifier('path');

function visitTupleObjectType(type: ts.TupleType, visitorContext: VisitorContext) {
    const name = VisitorUtils.getFullTypeName(type, visitorContext, { type: 'type-check' });
    return VisitorUtils.setFunctionIfNotExists(name, visitorContext, () => {
        if (type.typeArguments === undefined) {
            throw new Error('Expected tuple type to have type arguments.');
        }
        const functionNames = type.typeArguments.map((type) => visitType(type, visitorContext));
        const errorIdentifier = ts.createIdentifier('error');

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
                        VisitorUtils.createBinaries(
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
                ...functionNames.map((functionName, index) =>
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
                                        ts.createIdentifier(functionName),
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
        );
    });
}

function visitArrayObjectType(type: ts.ObjectType, visitorContext: VisitorContext) {
    const name = VisitorUtils.getFullTypeName(type, visitorContext, { type: 'type-check' });
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
                        VisitorUtils.createBinaries(
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
        );
    });
}

function visitRegularObjectType(type: ts.ObjectType, visitorContext: VisitorContext) {
    const name = VisitorUtils.getFullTypeName(type, visitorContext, { type: 'type-check' });
    return VisitorUtils.setFunctionIfNotExists(name, visitorContext, () => {
        const properties = visitorContext.checker.getPropertiesOfType(type);
        // const keyIdentifier = ts.createIdentifier('key');
        const errorIdentifier = ts.createIdentifier('error');
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
                ts.createIf(
                    VisitorUtils.createBinaries(
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
                        VisitorUtils.createBinaries(
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
                    const propertyInfo = VisitorUtils.getPropertyInfo(property, visitorContext);
                    const functionName = propertyInfo.optional
                        ? visitUndefinedOrType(propertyInfo.type, visitorContext)
                        : visitType(propertyInfo.type, visitorContext);
                    return ts.createBlock([
                        ts.createExpressionStatement(
                            ts.createCall(
                                ts.createPropertyAccess(pathIdentifier, 'push'),
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
                                        [ts.createElementAccess(objectIdentifier, ts.createStringLiteral(propertyInfo.name))]
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
                    ]);
                }),
                // TODO: check property index
                // const stringIndexType = visitorContext.checker.getIndexTypeOfType(type, ts.IndexKind.String);
                // if (stringIndexType) { }
                // There is a string index type { [Key: string]: T }.

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
        const name = VisitorUtils.getFullTypeName(type, visitorContext, { type: 'type-check' });
        const value = type.value;
        return VisitorUtils.setFunctionIfNotExists(name, visitorContext, () => {
            return VisitorUtils.createAssertionFunction(
                ts.createStrictInequality(
                    objectIdentifier,
                    ts.createStringLiteral(value)
                ),
                `expected string '${type.value}'`,
                name
            );
        });
    } else if (typeof type.value === 'number') {
        const name = VisitorUtils.getFullTypeName(type, visitorContext, { type: 'type-check' });
        return VisitorUtils.setFunctionIfNotExists(name, visitorContext, () => {
            return VisitorUtils.createAssertionFunction(
                ts.createStrictInequality(
                    objectIdentifier,
                    ts.createNumericLiteral(type.value.toString())
                ),
                `expected number '${type.value}'`,
                name
            );
        });
    } else {
        throw new Error('Type value is expected to be a string or number.');
    }
}

function visitUnionOrIntersectionType(type: ts.UnionOrIntersectionType, visitorContext: VisitorContext) {
    const name = VisitorUtils.getFullTypeName(type, visitorContext, { type: 'type-check' });
    return VisitorUtils.setFunctionIfNotExists(name, visitorContext, () => {
        const functionNames = type.types.map((type) => visitType(type, visitorContext));
        if (tsutils.isUnionType(type)) {
            return VisitorUtils.createDisjunctionFunction(functionNames, name);
        } else {
            return VisitorUtils.createConjunctionFunction(functionNames, name);
        }
    });
}

function visitBooleanLiteral(type: ts.Type, visitorContext: VisitorContext) {
    // Using internal TypeScript API, hacky.
    const intrinsicName: string | undefined = (type as { intrinsicName?: string }).intrinsicName;
    if (intrinsicName === 'true') {
        const name = '_true';
        return VisitorUtils.setFunctionIfNotExists(name, visitorContext, () => {
            return VisitorUtils.createAssertionFunction(
                ts.createStrictInequality(
                    objectIdentifier,
                    ts.createTrue()
                ),
                `expected true`,
                name
            );
        });
    } else if (intrinsicName === 'false') {
        const name = '_false';
        return VisitorUtils.setFunctionIfNotExists(name, visitorContext, () => {
            return VisitorUtils.createAssertionFunction(
                ts.createStrictInequality(
                    objectIdentifier,
                    ts.createFalse()
                ),
                `expected false`,
                name
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
            return VisitorUtils.createAssertionFunction(
                ts.createLogicalNot(condition),
                `expected a non-primitive`,
                name
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
    return VisitorUtils.getBigintFunction(visitorContext);
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
                                        ts.createIdentifier(functionName),
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
    });
}
