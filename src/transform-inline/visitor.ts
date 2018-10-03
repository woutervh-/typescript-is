import * as ts from 'typescript';
import * as tsutils from 'tsutils';
import { VisitorContext } from './visitor-context';
import { visitStringLiteralsOfType } from './visitor-string-literals';

function createPropertyCheck(accessor: ts.Expression, property: ts.Expression, type: ts.Type, optional: boolean, visitorContext: VisitorContext) {
    const oldMode = visitorContext.mode;
    visitorContext.mode = { type: 'type-check' };
    const propertyAccessor = oldMode.type === 'type-check'
        ? ts.createElementAccess(accessor, property)
        : accessor;
    const expression = visitType(type, propertyAccessor, visitorContext);
    visitorContext.mode = oldMode;
    let result: ts.Expression;
    if (!optional) {
        result = expression;
    } else {
        result = ts.createBinary(
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
    }
    return result;
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

function visitPropertySignature(node: ts.PropertySignature, accessor: ts.Expression, checkProperty: boolean, visitorContext: VisitorContext) {
    if (node.type === undefined) {
        throw new Error('Visiting property without type.');
    }
    const type = visitorContext.checker.getTypeFromTypeNode(node.type);
    if (checkProperty) {
        return createPropertyCheck(accessor, visitPropertyName(node.name, accessor, visitorContext), type, node.questionToken !== undefined, visitorContext);
    } else {
        return visitType(type, accessor, visitorContext);
    }
}

function visitDeclaration(node: ts.Declaration, accessor: ts.Expression, checkProperty: boolean, visitorContext: VisitorContext) {
    if (ts.isPropertySignature(node)) {
        return visitPropertySignature(node, accessor, checkProperty, visitorContext);
    } else {
        throw new Error('Unsupported declaration kind: ' + node.kind);
    }
}

function visitArrayObjectType(type: ts.ObjectType, accessor: ts.Expression, visitorContext: VisitorContext) {
    if (visitorContext.mode.type === 'type-check') {
        const numberIndexType = visitorContext.checker.getIndexTypeOfType(type, ts.IndexKind.Number);
        if (numberIndexType === undefined) {
            throw new Error('Expected array ObjectType to have a number index type.');
        }
        const itemIdentifier = ts.createIdentifier('item');
        return ts.createBinary(
            ts.createCall(
                ts.createPropertyAccess(ts.createIdentifier('Array'), ts.createIdentifier('isArray')),
                undefined,
                [accessor]
            ),
            ts.SyntaxKind.AmpersandAmpersandToken,
            ts.createCall(
                ts.createPropertyAccess(accessor, ts.createIdentifier('every')),
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
                                itemIdentifier
                            )
                        ],
                        undefined,
                        undefined,
                        ts.createBlock([
                            ts.createReturn(visitType(numberIndexType, itemIdentifier, visitorContext))
                        ])
                    )
                ]
            )
        );
    } else {
        throw new Error('visitArrayObjectType should only be called during type-check mode.');
    }
}

function visitPropertySymbol(property: ts.Symbol, accessor: ts.Expression, visitorContext: VisitorContext) {
    const conditions: ts.Expression[] = [];
    if ('valueDeclaration' in property) {
        conditions.push(visitDeclaration(property.valueDeclaration, accessor, true, visitorContext));
    } else {
        // Using internal TypeScript API, hacky.
        const propertyType = (property as { type?: ts.Type }).type;
        const propertyName = (property as { name?: string }).name;
        const optional = ((property as ts.Symbol).flags & ts.SymbolFlags.Optional) !== 0;
        if (propertyType !== undefined && propertyName !== undefined) {
            conditions.push(createPropertyCheck(accessor, ts.createStringLiteral(propertyName), propertyType, optional, visitorContext));
        }
    }
    return conditions.reduce((condition, expression) =>
        ts.createBinary(
            condition,
            ts.SyntaxKind.AmpersandAmpersandToken,
            expression
        )
    );
}

function visitRegularObjectType(type: ts.ObjectType, accessor: ts.Expression, visitorContext: VisitorContext) {
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
    }
    const mapper = mappers.reduce<(source: ts.Type) => ts.Type | undefined>((previous, next) => (source: ts.Type) => previous(source) || next(source), () => undefined);
    const conditions: ts.Expression[] = [];
    let token: ts.SyntaxKind.BarBarToken | ts.SyntaxKind.AmpersandAmpersandToken;

    if (visitorContext.mode.type === 'type-check') {
        token = ts.SyntaxKind.AmpersandAmpersandToken;
        conditions.push(
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
        );
        visitorContext.typeMapperStack.push(mapper);
        for (const property of visitorContext.checker.getPropertiesOfType(type)) {
            conditions.push(visitPropertySymbol(property, accessor, visitorContext));
        }
        const stringIndexType = visitorContext.checker.getIndexTypeOfType(type, ts.IndexKind.String);
        if (stringIndexType) {
            const keyIdentifier = ts.createIdentifier('key');
            const itemAccessor = ts.createElementAccess(accessor, keyIdentifier);
            conditions.push(
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
                                ts.createReturn(visitType(stringIndexType, itemAccessor, visitorContext))
                            ])
                        )
                    ]
                )
            );
        }
        visitorContext.typeMapperStack.pop();
    } else {
        token = ts.SyntaxKind.BarBarToken;
        visitorContext.typeMapperStack.push(mapper);
        for (const property of visitorContext.checker.getPropertiesOfType(type)) {
            if (visitorContext.mode.properties.indexOf(property.name) >= 0) {
                conditions.push(visitPropertySymbol(property, accessor, visitorContext));
            }
        }
        visitorContext.typeMapperStack.pop();
    }
    if (conditions.length >= 1) {
        return conditions.reduce((condition, expression) =>
            ts.createBinary(
                condition,
                token,
                expression
            )
        );
    } else {
        return token === ts.SyntaxKind.BarBarToken
            ? ts.createFalse()
            : ts.createTrue();
    }
}

function visitObjectType(type: ts.ObjectType, accessor: ts.Expression, visitorContext: VisitorContext) {
    if (visitorContext.checker.getIndexTypeOfType(type, ts.IndexKind.Number)) {
        return visitArrayObjectType(type, accessor, visitorContext);
    } else {
        return visitRegularObjectType(type, accessor, visitorContext);
    }
}

function visitLiteralType(type: ts.LiteralType, accessor: ts.Expression, visitorContext: VisitorContext) {
    if (visitorContext.mode.type === 'type-check') {
        if (typeof type.value === 'string') {
            return ts.createStrictEquality(accessor, ts.createStringLiteral(type.value));
        } else if (typeof type.value === 'number') {
            return ts.createStrictEquality(accessor, ts.createNumericLiteral(type.value.toString()));
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
        token = ts.SyntaxKind.BarBarToken;
    } else if (tsutils.isIntersectionType(type)) {
        token = ts.SyntaxKind.AmpersandAmpersandToken;
    } else {
        throw new Error('UnionOrIntersection type is expected to be a Union or Intersection type.');
    }
    return type.types
        .map((type) => visitType(type, accessor, visitorContext))
        .reduce((condition, expression) =>
            ts.createBinary(
                condition,
                token,
                expression
            )
        );
}

function visitBooleanLiteral(type: ts.Type, accessor: ts.Expression, visitorContext: VisitorContext) {
    if (visitorContext.mode.type === 'type-check') {
        // Using internal TypeScript API, hacky.
        return ts.createStrictEquality(
            accessor,
            (type as { intrinsicName?: string }).intrinsicName === 'true'
                ? ts.createTrue()
                : ts.createFalse()
        );
    } else {
        throw new Error('visitBooleanLiteral should only be called during type-check mode.');
    }
}

function visitNonPrimitiveType(type: ts.Type, accessor: ts.Expression, visitorContext: VisitorContext) {
    if (visitorContext.mode.type === 'type-check') {
        // Using internal TypeScript API, hacky.
        const intrinsicName: string | undefined = (type as { intrinsicName?: string }).intrinsicName;
        let conditions: ts.Expression[];
        if (intrinsicName === 'object') {
            conditions = [
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
                )
            ];
        } else {
            throw new Error(`Unsupported non-primitive with intrinsic name: ${intrinsicName}.`);
        }
        return conditions.reduce((condition, expression) =>
            ts.createBinary(
                condition,
                ts.SyntaxKind.AmpersandAmpersandToken,
                expression
            )
        );
    } else {
        throw new Error('visitNonPrimitiveType should only be called during type-check mode.');
    }
}

function visitTypeParameter(type: ts.Type, accessor: ts.Expression, visitorContext: VisitorContext) {
    const typeMapper = visitorContext.typeMapperStack[visitorContext.typeMapperStack.length - 1];
    if (typeMapper === undefined) {
        throw new Error('Unbound type parameter, missing type mapper.');
    }
    const mappedType = typeMapper(type);
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
        const propertyNames = Array.from(new Set(visitStringLiteralsOfType(indexedType, { ...visitorContext, mode: { type: 'property-names' } })));
        if (propertyNames.length >= 1) {
            return propertyNames
                .map((property) =>
                    ts.createStrictEquality(
                        accessor,
                        ts.createStringLiteral(property)
                    )
                )
                .reduce((condition, expression) =>
                    ts.createBinary(
                        condition,
                        ts.SyntaxKind.BarBarToken,
                        expression
                    )
                );
        } else {
            return ts.createFalse();
        }
    } else {
        throw new Error('visitIndexType should only be called during type-check mode.');
    }
}

function visitIndexedAccessType(type: ts.IndexedAccessType, accessor: ts.Expression, visitorContext: VisitorContext) {
    // T[U] -> index type = U, object type = T
    if (visitorContext.mode.type === 'type-check') {
        // Using internal TypeScript API, hacky.
        const indexedType = (type.indexType as { type?: ts.Type }).type;
        if ((type.indexType.flags & ts.TypeFlags.Index) !== 0 && indexedType === undefined) {
            throw new Error('Could not get indexed type of index type.');
        }
        const propertyNames = Array.from(new Set(visitStringLiteralsOfType(type.indexType, { ...visitorContext, mode: { type: 'literal' } })));
        const oldMode = visitorContext.mode;
        visitorContext.mode = { type: 'select-properties', properties: propertyNames };
        const result = visitType(type.objectType, accessor, visitorContext);
        visitorContext.mode = oldMode;
        return result;
    } else {
        throw new Error('visitIndexedAccessType should only be called during type-check mode.');
    }
}

function visitAny(type: ts.Type, accessor: ts.Expression, visitorContext: VisitorContext) {
    if (visitorContext.mode.type === 'type-check') {
        return ts.createTrue();
    } else {
        throw new Error('visitAny should only be called during type-check mode.');
    }
}

function visitNever(type: ts.Type, accessor: ts.Expression, visitorContext: VisitorContext) {
    if (visitorContext.mode.type === 'type-check') {
        return ts.createFalse();
    } else {
        throw new Error('visitNever should only be called during type-check mode.');
    }
}

function visitNull(type: ts.Type, accessor: ts.Expression, visitorContext: VisitorContext) {
    if (visitorContext.mode.type === 'type-check') {
        return ts.createStrictEquality(accessor, ts.createNull());
    } else {
        throw new Error('visitNull should only be called during type-check mode.');
    }
}

function visitUndefined(type: ts.Type, accessor: ts.Expression, visitorContext: VisitorContext) {
    if (visitorContext.mode.type === 'type-check') {
        return ts.createStrictEquality(accessor, ts.createIdentifier('undefined'));
    } else {
        throw new Error('visitUndefined should only be called during type-check mode.');
    }
}

function visitNumber(type: ts.Type, accessor: ts.Expression, visitorContext: VisitorContext) {
    if (visitorContext.mode.type === 'type-check') {
        return ts.createStrictEquality(ts.createTypeOf(accessor), ts.createStringLiteral('number'));
    } else {
        throw new Error('visitNumber should only be called during type-check mode.');
    }
}

function visitBoolean(type: ts.Type, accessor: ts.Expression, visitorContext: VisitorContext) {
    if (visitorContext.mode.type === 'type-check') {
        return ts.createStrictEquality(ts.createTypeOf(accessor), ts.createStringLiteral('boolean'));
    } else {
        throw new Error('visitBoolean should only be called during type-check mode.');
    }
}

function visitString(type: ts.Type, accessor: ts.Expression, visitorContext: VisitorContext) {
    if (visitorContext.mode.type === 'type-check') {
        return ts.createStrictEquality(ts.createTypeOf(accessor), ts.createStringLiteral('string'));
    } else {
        throw new Error('visitString should only be called during type-check mode.');
    }
}

export function visitType(type: ts.Type, accessor: ts.Expression, visitorContext: VisitorContext): ts.Expression {
    if ((ts.TypeFlags.Any & type.flags) !== 0) {
        // Any -> always true
        return visitAny(type, accessor, visitorContext);
    } else if ((ts.TypeFlags.Never & type.flags) !== 0) {
        // Never -> always false
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
        // Object type (including arrays)
        return visitObjectType(type, accessor, visitorContext);
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
