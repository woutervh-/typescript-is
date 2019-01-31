import * as ts from 'typescript';
import * as tsutils from 'tsutils';
import { VisitorContext } from './visitor-context';
import { ValidationReport, createDisjunctionValidationReport, createConditionalValidationReport, createAlwaysTrueValidationReport, createAlwaysFalseValidationReport, createConjunctionValidationReport, createArrayEveryValidationReport } from './validation-report';

function createPropertyCheck(accessor: ts.Expression, property: ts.Expression, type: ts.Type, optional: boolean, visitorContext: VisitorContext) {
    if (visitorContext.mode.type === 'type-check') {
        const propertyAccessor = ts.createElementAccess(accessor, property);
        const expression = visitType(type, propertyAccessor, { ...visitorContext, mode: { type: 'type-check' } });
        if (optional) {
            return ts.createBinary(
                ts.createLogicalNot(
                    ts.createBinary(
                        property,
                        ts.SyntaxKind.InKeyword,
                        accessor
                    )
                ),
                ts.SyntaxKind.BarBarToken,
                expression
            );
        } else {
            return ts.createBinary(
                ts.createBinary(
                    property,
                    ts.SyntaxKind.InKeyword,
                    accessor
                ),
                ts.SyntaxKind.AmpersandAmpersandToken,
                expression
            );
        }
    } else {
        return visitType(type, accessor, { ...visitorContext, mode: { type: 'type-check' } });
    }
}

function visitPropertyName(node: ts.PropertyName, accessor: ts.Expression, visitorContext: VisitorContext) {
    // Identifier | StringLiteral | NumericLiteral | ComputedPropertyName
    if (ts.isIdentifier(node)) {
        return ts.createStringLiteral(node.text);
    } else if (ts.isStringLiteral(node)) {
        return ts.createStringLiteral(node.text);
    } else if (ts.isNumericLiteral(node)) {
        return ts.createStringLiteral(node.text);
    } else {
        return node.expression;
    }
}

function visitPropertySignature(node: ts.PropertySignature, accessor: ts.Expression, visitorContext: VisitorContext) {
    if (node.type === undefined) {
        throw new Error('Visiting property without type.');
    }
    const type = visitorContext.checker.getTypeFromTypeNode(node.type);
    return createPropertyCheck(accessor, visitPropertyName(node.name, accessor, visitorContext), type, node.questionToken !== undefined, visitorContext);
}

function visitDeclaration(node: ts.Declaration, accessor: ts.Expression, visitorContext: VisitorContext) {
    if (ts.isPropertySignature(node)) {
        return visitPropertySignature(node, accessor, visitorContext);
    } else {
        throw new Error('Unsupported declaration kind: ' + node.kind);
    }
}

function visitTupleObjectType(type: ts.TupleType, accessor: ts.Expression, visitorContext: VisitorContext) {
    if (visitorContext.mode.type === 'type-check') {
        if (type.typeArguments === undefined) {
            throw new Error('Expected tuple type to have type arguments.');
        }
        const itemReports: ValidationReport[] = [];
        for (let i = 0; i < type.typeArguments.length; i++) {
            itemReports.push(visitType(type.typeArguments[i], ts.createElementAccess(accessor, i), visitorContext));
        }
        return createConjunctionValidationReport([
            createConditionalValidationReport(
                ts.createBinary(
                    ts.createCall(
                        ts.createPropertyAccess(ts.createIdentifier('Array'), ts.createIdentifier('isArray')),
                        undefined,
                        [accessor]
                    ),
                    ts.SyntaxKind.AmpersandAmpersandToken,
                    ts.createStrictEquality(
                        ts.createPropertyAccess(accessor, ts.createIdentifier('length')),
                        ts.createNumericLiteral(type.typeArguments.length.toString())
                    )
                ),
                `expected an array of length ${type.typeArguments.length}`
            ),
            ...itemReports
        ]);
    } else {
        throw new Error('visitTupleObjectType should only be called during type-check mode.');
    }
}

function visitArrayObjectType(type: ts.ObjectType, accessor: ts.Expression, visitorContext: VisitorContext) {
    if (visitorContext.mode.type === 'type-check') {
        const numberIndexType = visitorContext.checker.getIndexTypeOfType(type, ts.IndexKind.Number);
        if (numberIndexType === undefined) {
            throw new Error('Expected array ObjectType to have a number index type.');
        }
        const itemIdentifier = ts.createIdentifier('item');
        return createConjunctionValidationReport([
            createConditionalValidationReport(
                ts.createCall(
                    ts.createPropertyAccess(ts.createIdentifier('Array'), ts.createIdentifier('isArray')),
                    undefined,
                    [accessor]
                ),
                'expected an array'
            ),
            createArrayEveryValidationReport(
                accessor,
                itemIdentifier,
                visitType(numberIndexType, itemIdentifier, visitorContext)
            )
        ]);
    } else {
        throw new Error('visitArrayObjectType should only be called during type-check mode.');
    }
}

function visitPropertySymbol(property: ts.Symbol, accessor: ts.Expression, visitorContext: VisitorContext) {
    if ('valueDeclaration' in property) {
        return visitDeclaration(property.valueDeclaration, accessor, visitorContext);
    } else {
        // Using internal TypeScript API, hacky.
        const propertyType = (property as { type?: ts.Type }).type;
        const propertyName = (property as { name?: string }).name;
        const optional = ((property as ts.Symbol).flags & ts.SymbolFlags.Optional) !== 0;
        if (propertyType !== undefined && propertyName !== undefined) {
            return createPropertyCheck(accessor, ts.createStringLiteral(propertyName), propertyType, optional, visitorContext);
        } else {
            throw new Error('Expected a valueDeclaration or a property name and type.');
        }
    }
}

function visitRegularObjectType(type: ts.ObjectType, accessor: ts.Expression, visitorContext: VisitorContext) {
    const properties = visitorContext.checker.getPropertiesOfType(type);

    if (visitorContext.mode.type === 'type-check') {
        const validationReports: ValidationReport[] = [];
        validationReports.push(
            // Check the object itself: is it an object? Not an array? Not null?
            createConditionalValidationReport(
                [
                    ts.createStrictEquality(
                        ts.createTypeOf(accessor),
                        ts.createStringLiteral('object')
                    ),
                    ts.createStrictInequality(
                        accessor,
                        ts.createNull()
                    ),
                    ts.createLogicalNot(
                        ts.createCall(
                            ts.createPropertyAccess(ts.createIdentifier('Array'), ts.createIdentifier('isArray')),
                            undefined,
                            [accessor]
                        )
                    )
                ].reduce((condition, expression) =>
                    ts.createBinary(
                        condition,
                        ts.SyntaxKind.AmpersandAmpersandToken,
                        expression
                    )
                ),
                'expected an object'
            )
        );
        for (const property of properties) {
            // Visit each property.
            validationReports.push(visitPropertySymbol(property, accessor, visitorContext));
        }
        const stringIndexType = visitorContext.checker.getIndexTypeOfType(type, ts.IndexKind.String);
        if (stringIndexType) {
            // There is a string index type { [Key: string]: T }.
            const keyIdentifier = ts.createIdentifier('key');
            const itemAccessor = ts.createElementAccess(accessor, keyIdentifier);

            validationReports.push(
                createConditionalValidationReport(
                    ts.createCall(
                        ts.createPropertyAccess(
                            ts.createCall(
                                ts.createPropertyAccess(ts.createIdentifier('Object'), ts.createIdentifier('keys')),
                                undefined,
                                [accessor]
                            ),
                            ts.createIdentifier('every')
                        ),
                        undefined,
                        [
                            ts.createArrowFunction(
                                undefined,
                                undefined,
                                [
                                    ts.createParameter(
                                        undefined,
                                        undefined,
                                        undefined,
                                        keyIdentifier
                                    )
                                ],
                                undefined,
                                undefined,
                                ts.createBlock([
                                    ts.createReturn(
                                        ts.createBinary(
                                            // Check if key is of type string.
                                            ts.createStrictEquality(ts.createTypeOf(keyIdentifier), ts.createStringLiteral('string')),
                                            ts.SyntaxKind.AmpersandAmpersandToken,
                                            // Check if value is of the given index type.
                                            visitType(stringIndexType, itemAccessor, visitorContext)
                                        )
                                    )
                                ])
                            )
                        ]
                    ),
                    'expected string keys'
                )
            );
        }

        return createConjunctionValidationReport(validationReports);
    } else if (visitorContext.mode.type === 'keyof') {
        // In keyof mode we check if the accessor is equal to one of the property names.
        return createConditionalValidationReport(
            properties
                .map((property) =>
                    ts.createStrictEquality(accessor, ts.createStringLiteral(property.name))
                )
                .reduce<ts.Expression>((condition, expression) =>
                    ts.createBinary(
                        condition,
                        ts.SyntaxKind.BarBarToken,
                        expression
                    ),
                    ts.createFalse()
                ),
            `expected one of (${properties.map((property) => property.name).join(', ')})`
        );
    } else {
        // In indexed-access mode we check if the accessor is of the specified index type.
        const indexType = visitorContext.mode.indexType;
        return createConditionalValidationReport(
            properties
                .map((property) => {
                    const propertyNameAccessor = ts.createStringLiteral(property.name);
                    const propertyNameExpression = visitType(indexType, propertyNameAccessor, { ...visitorContext, mode: { type: 'type-check' } });
                    // const propertyType = visitorContext.checker.getDeclaredTypeOfSymbol(property);
                    // const propertyTypeExpression = visitType(propertyType, accessor, { ...visitorContext, mode: { type: 'type-check' } });
                    const propertyTypeExpression = visitPropertySymbol(property, accessor, visitorContext);
                    return ts.createBinary(
                        ts.createLogicalNot(propertyNameExpression),
                        ts.SyntaxKind.BarBarToken,
                        propertyTypeExpression
                    );
                })
                .reduce<ts.Expression>((condition, expression) =>
                    ts.createBinary(
                        condition,
                        ts.SyntaxKind.BarBarToken,
                        expression
                    ),
                    ts.createFalse()
                ),
            'TODO' // TODO: reason
        );
    }
}

function visitObjectType(type: ts.ObjectType, accessor: ts.Expression, visitorContext: VisitorContext) {
    const mappers: ((source: ts.Type) => ts.Type | undefined)[] = [];
    (function checkBaseTypes(type: ts.Type) {
        if (tsutils.isTypeReference(type) && tsutils.isInterfaceType(type.target)) {
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
    let targetType: ts.ObjectType;
    if (tsutils.isTypeReference(type)) {
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
        targetType = type.target;
    } else {
        targetType = type;
    }
    const mapper = mappers.reduce<(source: ts.Type) => ts.Type | undefined>((previous, next) => (source: ts.Type) => previous(source) || next(source), () => undefined);
    let validationReport: ValidationReport;
    visitorContext.typeMapperStack.push(mapper);
    if (tsutils.isTupleType(targetType)) {
        validationReport = visitTupleObjectType(targetType, accessor, visitorContext);
    } else if (visitorContext.checker.getIndexTypeOfType(targetType, ts.IndexKind.Number)) {
        validationReport = visitArrayObjectType(targetType, accessor, visitorContext);
    } else {
        validationReport = visitRegularObjectType(targetType, accessor, visitorContext);
    }
    visitorContext.typeMapperStack.pop();
    return validationReport;
}

function visitLiteralType(type: ts.LiteralType, accessor: ts.Expression, visitorContext: VisitorContext) {
    if (visitorContext.mode.type === 'type-check') {
        if (typeof type.value === 'string') {
            return createConditionalValidationReport(
                ts.createStrictEquality(accessor, ts.createStringLiteral(type.value)),
                `expected literal string (${type.value})`
            );
        } else if (typeof type.value === 'number') {
            return createConditionalValidationReport(
                ts.createStrictEquality(accessor, ts.createNumericLiteral(type.value.toString())),
                `expected literal number (${type.value})`
            );
        } else {
            throw new Error('Type value is expected to be a string or number.');
        }
    } else {
        throw new Error('visitLiteralType should only be called during type-check mode.');
    }
}

function visitUnionOrIntersectionType(type: ts.Type, accessor: ts.Expression, visitorContext: VisitorContext) {
    let token: ts.SyntaxKind.BarBarToken | ts.SyntaxKind.AmpersandAmpersandToken;
    if (tsutils.isUnionType(type)) {
        if (visitorContext.mode.type === 'keyof' || visitorContext.mode.type === 'indexed-access') {
            token = ts.SyntaxKind.AmpersandAmpersandToken;
        } else {
            token = ts.SyntaxKind.BarBarToken;
        }
    } else if (tsutils.isIntersectionType(type)) {
        if (visitorContext.mode.type === 'keyof' || visitorContext.mode.type === 'indexed-access') {
            token = ts.SyntaxKind.BarBarToken;
        } else {
            token = ts.SyntaxKind.AmpersandAmpersandToken;
        }
    } else {
        throw new Error('UnionOrIntersection type is expected to be a Union or Intersection type.');
    }
    if (token === ts.SyntaxKind.BarBarToken) {
        return createDisjunctionValidationReport(
            type.types.map((type) => visitType(type, accessor, visitorContext))
        );
    } else {
        return createConjunctionValidationReport(
            type.types.map((type) => visitType(type, accessor, visitorContext))
        );
    }
}

function visitBooleanLiteral(type: ts.Type, accessor: ts.Expression, visitorContext: VisitorContext) {
    if (visitorContext.mode.type === 'type-check') {
        // Using internal TypeScript API, hacky.
        if ((type as { intrinsicName?: string }).intrinsicName === 'true') {
            return createConditionalValidationReport(
                ts.createStrictEquality(
                    accessor,
                    ts.createTrue()
                ),
                'expected true'
            );
        } else {
            return createConditionalValidationReport(
                ts.createStrictEquality(
                    accessor,
                    ts.createFalse()
                ),
                'expected false'
            );
        }
    } else {
        throw new Error('visitBooleanLiteral should only be called during type-check mode.');
    }
}

function visitNonPrimitiveType(type: ts.Type, accessor: ts.Expression, visitorContext: VisitorContext) {
    if (visitorContext.mode.type === 'type-check') {
        // Using internal TypeScript API, hacky.
        const intrinsicName: string | undefined = (type as { intrinsicName?: string }).intrinsicName;
        if (intrinsicName === 'object') {
            const conditions: ts.Expression[] = [
                ts.createStrictInequality(
                    ts.createTypeOf(accessor),
                    ts.createStringLiteral('boolean')
                ),
                ts.createStrictInequality(
                    ts.createTypeOf(accessor),
                    ts.createStringLiteral('number')
                ),
                ts.createStrictInequality(
                    ts.createTypeOf(accessor),
                    ts.createStringLiteral('string')
                ),
                ts.createStrictInequality(
                    accessor,
                    ts.createNull()
                ),
                ts.createStrictInequality(
                    accessor,
                    ts.createIdentifier('undefined')
                )
            ];
            return createConditionalValidationReport(
                conditions.reduce((condition, expression) =>
                    ts.createBinary(
                        condition,
                        ts.SyntaxKind.AmpersandAmpersandToken,
                        expression
                    )
                ),
                'expected a non-primitive'
            );
        } else {
            throw new Error(`Unsupported non-primitive with intrinsic name: ${intrinsicName}.`);
        }
    } else {
        throw new Error('visitNonPrimitiveType should only be called during type-check mode.');
    }
}

function visitTypeParameter(type: ts.Type, accessor: ts.Expression, visitorContext: VisitorContext) {
    // const typeMapper = visitorContext.typeMapperStack[visitorContext.typeMapperStack.length - 1];
    const typeMapper = visitorContext.typeMapperStack.reduceRight<(source: ts.Type) => ts.Type | undefined>((previous, next) => (source: ts.Type) => previous(source) || next(source), () => undefined);
    if (typeMapper === undefined) {
        throw new Error('Unbound type parameter, missing type mapper.');
    }
    const mappedType = typeMapper(type) || type.getDefault();
    if (mappedType === undefined) {
        throw new Error('Unbound type parameter, missing type node.');
    }
    return visitType(mappedType, accessor, visitorContext);
}

function visitIndexType(type: ts.Type, accessor: ts.Expression, visitorContext: VisitorContext) {
    if (visitorContext.mode.type === 'type-check') {
        // Using internal TypeScript API, hacky.
        const indexedType = (type as { type?: ts.Type }).type;
        if (indexedType === undefined) {
            throw new Error('Could not get indexed type of index type.');
        }
        return visitType(indexedType, accessor, { ...visitorContext, mode: { type: 'keyof' } });
    } else {
        throw new Error('visitIndexType should only be called during type-check mode.');
    }
}

function visitIndexedAccessType(type: ts.IndexedAccessType, accessor: ts.Expression, visitorContext: VisitorContext) {
    // T[U] -> index type = U, object type = T
    if (visitorContext.mode.type === 'type-check') {
        return visitType(type.objectType, accessor, { ...visitorContext, mode: { type: 'indexed-access', indexType: type.indexType } });
    } else {
        throw new Error('visitIndexedAccessType should only be called during type-check mode.');
    }
}

function visitAny(type: ts.Type, accessor: ts.Expression, visitorContext: VisitorContext) {
    if (visitorContext.mode.type === 'type-check') {
        return createAlwaysTrueValidationReport();
    } else if (visitorContext.mode.type === 'keyof') {
        return createConditionalValidationReport(
            ts.createStrictEquality(ts.createTypeOf(accessor), ts.createStringLiteral('string')),
            'expected a string'
        );
    } else {
        return createAlwaysTrueValidationReport();
    }
}

function visitUnknown(type: ts.Type, accessor: ts.Expression, visitorContext: VisitorContext) {
    if (visitorContext.mode.type === 'type-check') {
        return createAlwaysTrueValidationReport();
    } else if (visitorContext.mode.type === 'keyof') {
        return createAlwaysFalseValidationReport('type is never');
    } else {
        throw new Error('visitUnknown should only be called during type-check or keyof mode.');
    }
}

function visitNever(type: ts.Type, accessor: ts.Expression, visitorContext: VisitorContext) {
    return createAlwaysFalseValidationReport('type is never');
}

function visitNull(type: ts.Type, accessor: ts.Expression, visitorContext: VisitorContext) {
    if (visitorContext.mode.type === 'type-check') {
        return createConditionalValidationReport(
            ts.createStrictEquality(accessor, ts.createNull()),
            'expected null'
        );
    } else {
        throw new Error('visitNull should only be called during type-check mode.');
    }
}

function visitUndefined(type: ts.Type, accessor: ts.Expression, visitorContext: VisitorContext) {
    if (visitorContext.mode.type === 'type-check') {
        return createConditionalValidationReport(
            ts.createStrictEquality(accessor, ts.createIdentifier('undefined')),
            'expected undefined'
        );
    } else {
        throw new Error('visitUndefined should only be called during type-check mode.');
    }
}

function visitNumber(type: ts.Type, accessor: ts.Expression, visitorContext: VisitorContext) {
    if (visitorContext.mode.type === 'type-check') {
        return createConditionalValidationReport(
            ts.createStrictEquality(ts.createTypeOf(accessor), ts.createStringLiteral('number')),
            'expected a number'
        );
    } else {
        throw new Error('visitNumber should only be called during type-check mode.');
    }
}

function visitBoolean(type: ts.Type, accessor: ts.Expression, visitorContext: VisitorContext) {
    if (visitorContext.mode.type === 'type-check') {
        return createConditionalValidationReport(
            ts.createStrictEquality(ts.createTypeOf(accessor), ts.createStringLiteral('boolean')),
            'expected a boolean'
        );
    } else {
        throw new Error('visitBoolean should only be called during type-check mode.');
    }
}

function visitString(type: ts.Type, accessor: ts.Expression, visitorContext: VisitorContext) {
    if (visitorContext.mode.type === 'type-check') {
        return createConditionalValidationReport(
            ts.createStrictEquality(ts.createTypeOf(accessor), ts.createStringLiteral('string')),
            'expected a string'
        );
    } else {
        throw new Error('visitString should only be called during type-check mode.');
    }
}

export function visitType(type: ts.Type, accessor: ts.Expression, visitorContext: VisitorContext): ValidationReport {
    if ((ts.TypeFlags.Any & type.flags) !== 0) {
        // Any
        return visitAny(type, accessor, visitorContext);
    } else if ((ts.TypeFlags.Unknown & type.flags) !== 0) {
        // Unknown
        return visitUnknown(type, accessor, visitorContext);
    } else if ((ts.TypeFlags.Never & type.flags) !== 0) {
        // Never
        return visitNever(type, accessor, visitorContext);
    } else if ((ts.TypeFlags.Null & type.flags) !== 0) {
        // Null
        return visitNull(type, accessor, visitorContext);
    } else if ((ts.TypeFlags.Undefined & type.flags) !== 0) {
        // Undefined
        return visitUndefined(type, accessor, visitorContext);
    } else if ((ts.TypeFlags.Number & type.flags) !== 0) {
        // Number
        return visitNumber(type, accessor, visitorContext);
    } else if ((ts.TypeFlags.Boolean & type.flags) !== 0) {
        // Boolean
        return visitBoolean(type, accessor, visitorContext);
    } else if ((ts.TypeFlags.String & type.flags) !== 0) {
        // String
        return visitString(type, accessor, visitorContext);
    } else if ((ts.TypeFlags.BooleanLiteral & type.flags) !== 0) {
        // Boolean literal (true/false)
        return visitBooleanLiteral(type, accessor, visitorContext);
    } else if ((ts.TypeFlags.TypeParameter & type.flags) !== 0) {
        // Type parameter
        return visitTypeParameter(type, accessor, visitorContext);
    } else if (tsutils.isObjectType(type)) {
        // Object type (including interfaces, arrays, tuples)
        if ((ts.ObjectFlags.Class & type.objectFlags) !== 0) {
            throw new Error('Classes cannot be validated. Please check the README.');
        } else {
            return visitObjectType(type, accessor, visitorContext);
        }
    } else if (tsutils.isLiteralType(type)) {
        // Literal string/number types ('foo')
        return visitLiteralType(type, accessor, visitorContext);
    } else if (tsutils.isUnionOrIntersectionType(type)) {
        // Union or intersection type (| or &)
        return visitUnionOrIntersectionType(type, accessor, visitorContext);
    } else if ((ts.TypeFlags.NonPrimitive & type.flags) !== 0) {
        // Non-primitive such as object
        return visitNonPrimitiveType(type, accessor, visitorContext);
    } else if ((ts.TypeFlags.Index & type.flags) !== 0) {
        // Index type: keyof T
        return visitIndexType(type, accessor, visitorContext);
    } else if (tsutils.isIndexedAccessType(type)) {
        // Indexed access type: T[U]
        return visitIndexedAccessType(type, accessor, visitorContext);
    } else {
        throw new Error('Could not generate type-check; unsupported type with flags: ' + type.flags);
    }
}

export function visitUndefinedOrType(type: ts.Type, accessor: ts.Expression, visitorContext: VisitorContext) {
    return createDisjunctionValidationReport(
        [
            visitUndefined(type, accessor, visitorContext),
            visitType(type, accessor, visitorContext)
        ]
    );
}
