import * as ts from 'typescript';
import * as tsutils from 'tsutils';
import { VisitorContext } from './visitor-context';

const accessorIdentifier = ts.createIdentifier('object');
const pathIdentifier = ts.createIdentifier('object');

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
            ts.createParameter(undefined, undefined, undefined, accessorIdentifier, undefined, undefined, undefined),
            ts.createParameter(undefined, undefined, undefined, pathIdentifier, undefined, undefined, undefined)
        ],
        undefined,
        ts.createBlock([
            ts.createReturn(
                ts.createNew(
                    ts.createIdentifier('Error'),
                    undefined,
                    [
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
                                ts.createStringLiteral(`, because ${reason}`)
                            ],
                            ts.SyntaxKind.PlusToken
                        )
                    ]
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
            ts.createParameter(undefined, undefined, undefined, accessorIdentifier, undefined, undefined, undefined),
            ts.createParameter(undefined, undefined, undefined, pathIdentifier, undefined, undefined, undefined)
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
                    [
                        ts.createVariableDeclaration(
                            conditionIdentifier,
                            undefined,
                            undefined
                        )
                    ],
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
                                    [
                                        accessorIdentifier,
                                        pathIdentifier
                                    ]
                                )
                            )
                        ]
                    ),
                    ts.createIf(
                        errorIdentifier,
                        ts.createReturn(
                            ts.createNew(
                                ts.createIdentifier('Error'),
                                undefined,
                                [
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
                                            ts.createStringLiteral(`, because: `),
                                            errorIdentifier
                                        ],
                                        ts.SyntaxKind.PlusToken
                                    )
                                ]
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
            ts.createParameter(undefined, undefined, undefined, accessorIdentifier, undefined, undefined, undefined),
            ts.createParameter(undefined, undefined, undefined, pathIdentifier, undefined, undefined, undefined)
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
                    [
                        ts.createVariableDeclaration(
                            conditionIdentifier,
                            undefined,
                            undefined
                        )
                    ],
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
                                    [
                                        accessorIdentifier,
                                        pathIdentifier
                                    ]
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
                ts.createNew(
                    ts.createIdentifier('Error'),
                    undefined,
                    [
                        ts.createStringLiteral('Invalid TODO') // TODO:
                    ]
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
            ts.createParameter(undefined, undefined, undefined, accessorIdentifier, undefined, undefined, undefined),
            ts.createParameter(undefined, undefined, undefined, pathIdentifier, undefined, undefined, undefined)
        ],
        undefined,
        ts.createBlock([
            ts.createIf(
                expression,
                ts.createReturn(
                    ts.createNew(
                        ts.createIdentifier('Error'),
                        undefined,
                        [
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
                                    ts.createStringLiteral(`, because ${reason}`)
                                ],
                                ts.SyntaxKind.PlusToken
                            )
                        ]
                    )
                ),
                ts.createReturn(ts.createNull())
            )
        ])
    );
}

function createPropertyCheck(accessor: ts.Expression, property: ts.Expression, type: ts.Type, optional: boolean, visitorContext: VisitorContext) {
    const name = ts.isStringLiteral(property) ? property.text : '[unknown]';
    if (visitorContext.mode.type === 'type-check') {
        const propertyAccessor = ts.createElementAccess(accessor, property);
        visitorContext.pathStack.push(name);
        const report = visitType(type, propertyAccessor, visitorContext);
        visitorContext.pathStack.pop();
        if (optional) {
            return createDisjunctionValidationReport(
                visitorContext.pathStack.slice(),
                [
                    createConditionalValidationReport(
                        visitorContext.pathStack.slice(),
                        ts.createLogicalNot(
                            ts.createBinary(
                                property,
                                ts.SyntaxKind.InKeyword,
                                accessor
                            )
                        ),
                        `found '${name}' in object`
                    ),
                    report
                ]
            );
        } else {
            return createConjunctionValidationReport(
                visitorContext.pathStack.slice(),
                [
                    createConditionalValidationReport(
                        visitorContext.pathStack.slice(),
                        ts.createBinary(
                            property,
                            ts.SyntaxKind.InKeyword,
                            accessor
                        ),
                        `expected '${name}' in object`
                    ),
                    report
                ]
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
    } else if ((node.kind & ts.SyntaxKind.MethodSignature) !== 0) {
        throw new Error('Encountered a method declaration, but methods are not supported. Please check the README.');
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
            visitorContext.pathStack.push(`[${i}]`);
            itemReports.push(visitType(type.typeArguments[i], ts.createElementAccess(accessor, i), visitorContext));
            visitorContext.pathStack.pop();
        }
        return createConjunctionValidationReport(
            visitorContext.pathStack.slice(),
            [
                createConditionalValidationReport(
                    visitorContext.pathStack.slice(),
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
                    `expected array of length ${type.typeArguments.length}`
                ),
                ...itemReports
            ]
        );
    } else if (visitorContext.mode.type === 'string-literal') {
        return createAlwaysFalseValidationReport(visitorContext.pathStack.slice(), 'Tuple type cannot be used as an index type.');
    } else {
        throw new Error('visitTupleObjectType should only be called during type-check or string-literal mode.');
    }
}

function visitArrayObjectType(type: ts.ObjectType, accessor: ts.Expression, visitorContext: VisitorContext) {
    if (visitorContext.mode.type === 'type-check') {
        const numberIndexType = visitorContext.checker.getIndexTypeOfType(type, ts.IndexKind.Number);
        if (numberIndexType === undefined) {
            throw new Error('Expected array ObjectType to have a number index type.');
        }
        const itemIdentifier = ts.createIdentifier('item');
        visitorContext.pathStack.push('[]');
        const typeReport = visitType(numberIndexType, itemIdentifier, visitorContext);
        visitorContext.pathStack.pop();
        return createConjunctionValidationReport(
            visitorContext.pathStack.slice(),
            [
                createConditionalValidationReport(
                    visitorContext.pathStack.slice(),
                    ts.createCall(
                        ts.createPropertyAccess(ts.createIdentifier('Array'), ts.createIdentifier('isArray')),
                        undefined,
                        [accessor]
                    ),
                    'expected array'
                ),
                createArrayEveryValidationReport(
                    visitorContext.pathStack.slice(),
                    accessor,
                    itemIdentifier,
                    typeReport
                )
            ]
        );
    } else if (visitorContext.mode.type === 'string-literal') {
        return createAlwaysFalseValidationReport(visitorContext.pathStack.slice(), 'Array type cannot be used as an index type.');
    } else {
        throw new Error('visitArrayObjectType should only be called during type-check or string-literal mode.');
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
                visitorContext.pathStack.slice(),
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
                'expected object'
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
            visitorContext.pathStack.push('[]');
            const typeReport = visitType(stringIndexType, itemAccessor, visitorContext);
            visitorContext.pathStack.pop();
            validationReports.push(
                createObjectEveryValidationReport(
                    visitorContext.pathStack.slice(),
                    accessor,
                    keyIdentifier,
                    typeReport
                )
            );
        }

        return createConjunctionValidationReport(visitorContext.pathStack.slice(), validationReports);
    } else if (visitorContext.mode.type === 'string-literal-keyof') {
        const value = visitorContext.mode.value;
        const match = properties.some((property) => property.name === value);
        if (match) {
            return createAlwaysTrueValidationReport(visitorContext.pathStack);
        } else {
            return createAlwaysFalseValidationReport(visitorContext.pathStack.slice(), `'${visitorContext.mode.value}' is not assignable to any key of object.`);
        }
    } else if (visitorContext.mode.type === 'keyof') {
        // In keyof mode we check if the accessor is equal to one of the property names.
        return createConditionalValidationReport(
            visitorContext.pathStack.slice(),
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
    } else if (visitorContext.mode.type === 'indexed-access') {
        // In indexed-access mode we check if the accessor is of the property type T[U].
        const indexType = visitorContext.mode.indexType;
        return createDisjunctionValidationReport(
            visitorContext.pathStack.slice(),
            properties
                .map((property) => {
                    // TODO: would be cool to have checker.isAssignableTo(indexType, createStringLiteralType(property.name))
                    // https://github.com/Microsoft/TypeScript/issues/9879
                    const stringLiteralReport = visitType(indexType, accessor, { ...visitorContext, mode: { type: 'string-literal', value: property.name } });
                    if (reduceNonConditionals(stringLiteralReport)) {
                        return visitPropertySymbol(property, accessor, visitorContext);
                    } else {
                        return createAlwaysTrueValidationReport(visitorContext.pathStack);
                    }
                })
        );
    } else if (visitorContext.mode.type === 'string-literal') {
        return createAlwaysFalseValidationReport(visitorContext.pathStack.slice(), 'Object type cannot be used as an index type.');
    } else {
        throw new Error('Not yet implemented.');
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

function visitLiteralType(type: ts.LiteralType, visitorContext: VisitorContext) {
    if (!visitorContext.functionMap.has(type)) {
        if (typeof type.value === 'string') {
            visitorContext.functionMap.set(
                type,
                createAssertionFunction(
                    ts.createStrictInequality(
                        accessorIdentifier,
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
                        accessorIdentifier,
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
        const conditions = type.types.map((type) => {
            const functionDeclaration = visitType(type, visitorContext);
            return ts.createCall(
                functionDeclaration.name!,
                undefined,
                [
                    accessorIdentifier,
                    pathIdentifier
                ]
            );
        });

        if (tsutils.isUnionType(type)) {
            visitorContext.functionMap.set(
                type,

            );
        } else {

        }
    }
    return visitorContext.functionMap.get(type)!;

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
            visitorContext.pathStack.slice(),
            type.types.map((type) => visitType(type, accessor, visitorContext))
        );
    } else {
        return createConjunctionValidationReport(
            visitorContext.pathStack.slice(),
            type.types.map((type) => visitType(type, accessor, visitorContext))
        );
    }
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
                        accessorIdentifier,
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
                        accessorIdentifier,
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
                    ts.createTypeOf(accessorIdentifier),
                    ts.createStringLiteral('boolean')
                ),
                ts.createStrictInequality(
                    ts.createTypeOf(accessorIdentifier),
                    ts.createStringLiteral('number')
                ),
                ts.createStrictInequality(
                    ts.createTypeOf(accessorIdentifier),
                    ts.createStringLiteral('string')
                ),
                ts.createStrictInequality(
                    accessorIdentifier,
                    ts.createNull()
                ),
                ts.createStrictInequality(
                    accessorIdentifier,
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
                    accessorIdentifier,
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
                    accessorIdentifier,
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
                    ts.createTypeOf(accessorIdentifier),
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
                    ts.createTypeOf(accessorIdentifier),
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
                    ts.createTypeOf(accessorIdentifier),
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
                    ts.createTypeOf(accessorIdentifier),
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
    return createDisjunctionValidationReport(
        visitorContext.pathStack.slice(),
        [
            visitUndefined(type, accessor, visitorContext),
            visitType(type, accessor, visitorContext)
        ]
    );
}
