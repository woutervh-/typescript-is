import * as ts from 'typescript';
import * as tsutils from 'tsutils';
import { VisitorContext } from './visitor-context';

function visitPropertyName(node: ts.PropertyName, accessor: ts.Expression, visitorContext: VisitorContext): ts.Expression {
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
    const propertyAccessor = ts.createElementAccess(accessor, visitPropertyName(node.name, accessor, visitorContext));
    if (node.type === undefined) {
        throw new Error('Visiting property without type.');
    }
    const type = visitorContext.checker.getTypeFromTypeNode(node.type);
    const expression = visitType(type, propertyAccessor, visitorContext);
    if (node.questionToken === undefined) {
        return expression;
    } else {
        return ts.createBinary(
            ts.createBinary(
                propertyAccessor,
                ts.SyntaxKind.InKeyword,
                accessor
            ),
            ts.SyntaxKind.BarBarToken,
            expression
        );
    }
}

function visitDeclaration(node: ts.Declaration, accessor: ts.Expression, visitorContext: VisitorContext): ts.Expression {
    if (ts.isPropertySignature(node)) {
        return visitPropertySignature(node, accessor, visitorContext);
    } else {
        throw new Error('Unsupported declaration kind: ' + node.kind);
    }
}

function visitObjectType(type: ts.ObjectType, accessor: ts.Expression, visitorContext: VisitorContext): ts.Expression {
    const mappers: ((source: ts.Type) => ts.Type | undefined)[] = [];
    if (tsutils.isTypeReference(type)) {
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
                }
            }
        }
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
    const conditions: ts.Expression[] = [
        ts.createStrictEquality(
            ts.createTypeOf(accessor),
            ts.createStringLiteral('object')
        ),
        ts.createStrictInequality(
            accessor,
            ts.createNull()
        )
    ];
    visitorContext.typeMapperStack.push(mapper);
    for (const property of visitorContext.checker.getPropertiesOfType(type)) {
        if ('valueDeclaration' in property) {
            conditions.push(visitDeclaration(property.valueDeclaration, accessor, visitorContext));
        } else {
            // Would like to use official APIs.
            const propertyType = (property as { type?: ts.Type }).type;
            const propertyName = (property as { name?: ts.Type }).name;
            if (propertyType !== undefined && propertyName !== undefined) {
                const propertySignature = ts.createPropertySignature(
                    undefined,
                    propertyName,
                    property.flags & ts.SymbolFlags.Optional
                );
            }
        }
    }
    visitorContext.typeMapperStack.pop();
    return conditions.reduce((condition, expression) =>
        ts.createBinary(
            condition,
            ts.SyntaxKind.AmpersandAmpersandToken,
            expression
        )
    );
}

function visitLiteralType(type: ts.LiteralType, accessor: ts.Expression, visitorContext: VisitorContext) {
    if (typeof type.value === 'string') {
        return ts.createStrictEquality(accessor, ts.createStringLiteral(type.value));
    } else if (typeof type.value === 'number') {
        return ts.createStrictEquality(accessor, ts.createNumericLiteral(type.value.toString()));
    } else {
        throw new Error('Type value is expected to be a string or number.');
    }
}

export function visitType(type: ts.Type, accessor: ts.Expression, visitorContext: VisitorContext): ts.Expression {
    if ((ts.TypeFlags.Number & type.flags) !== 0) {
        return ts.createStrictEquality(ts.createTypeOf(accessor), ts.createStringLiteral('number'));
    } else if ((ts.TypeFlags.Boolean & type.flags) !== 0) {
        return ts.createStrictEquality(ts.createTypeOf(accessor), ts.createStringLiteral('boolean'));
    } else if ((ts.TypeFlags.String & type.flags) !== 0) {
        return ts.createStrictEquality(ts.createTypeOf(accessor), ts.createStringLiteral('string'));
    } else if ((ts.TypeFlags.TypeParameter & type.flags) !== 0) {
        const typeMapper = visitorContext.typeMapperStack[visitorContext.typeMapperStack.length - 1];
        if (typeMapper === undefined) {
            throw new Error('Unbound type parameter, missing type mapper.');
        }
        const mappedType = typeMapper(type);
        if (mappedType === undefined) {
            throw new Error('Unbound type parameter, missing type node.');
        }
        return visitType(mappedType, accessor, visitorContext);
    } else if (tsutils.isObjectType(type)) {
        return visitObjectType(type, accessor, visitorContext);
    } else if (tsutils.isLiteralType(type)) {
        return visitLiteralType(type, accessor, visitorContext);
    } else {
        throw new Error('Unsupported type with flags: ' + type.flags);
    }
}
