import * as ts from 'typescript';
import * as tsutils from 'tsutils';
import { VisitorContext } from './visitor-context';

function reportNode(node: ts.Node) {
    const sourceFile = node.getSourceFile();
    const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
    return `${sourceFile.fileName}:${line + 1}:${character + 1}`;
}

function stringifyTypeNodes(nodes: ts.NodeArray<ts.TypeNode> | undefined, visitorContext: VisitorContext): string {
    return nodes === undefined ? '' : '<' + nodes.map((node) => stringifyTypeNode(node, visitorContext)).join(',') + '>';
}

function stringifyTypeNode(node: ts.TypeNode, visitorContext: VisitorContext): string {
    if (node.kind === ts.SyntaxKind.NumberKeyword) {
        return 'number';
    } else if (node.kind === ts.SyntaxKind.StringKeyword) {
        return 'string';
    } else if (node.kind === ts.SyntaxKind.BooleanKeyword) {
        return 'boolean';
    } else if (ts.isTypeReferenceNode(node)) {
        const type = visitorContext.checker.getTypeFromTypeNode(node);
        const fqn = visitorContext.checker.getFullyQualifiedName(type.symbol);
        const typeArgumentsPostfix = stringifyTypeNodes(node.typeArguments, visitorContext);
        return fqn + typeArgumentsPostfix;
    } else if (ts.isLiteralTypeNode(node)) {
        if (ts.isStringLiteral(node.literal)) {
            return JSON.stringify(node.literal.text);
        } else {
            throw new Error('Unsupported LiteralTypeNode kind: ' + node.kind);
        }
    } else {
        throw new Error('Unsupported TypeNode kind: ' + node.kind);
    }
}

function constructArrowFunction(identifier: ts.Identifier, returnExpression: ts.Expression) {
    return ts.createArrowFunction(
        undefined,
        undefined,
        [
            ts.createParameter(
                undefined,
                undefined,
                undefined,
                identifier
            )
        ],
        undefined,
        undefined,
        ts.createBlock([ts.createReturn(returnExpression)])
    );
}

function visitNumberKeyword(node: ts.TypeNode, accessor: ts.Expression, visitorContext: VisitorContext) {
    return ts.createStrictEquality(ts.createTypeOf(accessor), ts.createStringLiteral('number'));
}

function visitBooleanKeyword(node: ts.TypeNode, accessor: ts.Expression, visitorContext: VisitorContext) {
    return ts.createStrictEquality(ts.createTypeOf(accessor), ts.createStringLiteral('boolean'));
}

function visitStringKeyword(node: ts.TypeNode, accessor: ts.Expression, visitorContext: VisitorContext) {
    return ts.createStrictEquality(ts.createTypeOf(accessor), ts.createStringLiteral('string'));
}

function visitInterfaceDeclaration(node: ts.InterfaceDeclaration, accessor: ts.Expression, visitorContext: VisitorContext): ts.Expression {
    const typeArguments = visitorContext.typeArgumentsStack[visitorContext.typeArgumentsStack.length - 1];
    const conditions: ts.Expression[] = [];
    conditions.push(ts.createStrictEquality(ts.createTypeOf(accessor), ts.createStringLiteral('object')));
    conditions.push(ts.createStrictInequality(accessor, ts.createNull()));

    const typeParameterTypes = node.typeParameters === undefined
        ? undefined
        : node.typeParameters.map((typeParameter) => visitorContext.checker.getTypeAtLocation(typeParameter));

    if (node.heritageClauses) {
        for (const heritageClause of node.heritageClauses) {
            for (const heritageType of heritageClause.types) {
                if (ts.isIdentifier(heritageType.expression)) {
                    const heritageTypeArguments = heritageType.typeArguments === undefined
                        ? undefined
                        : heritageType.typeArguments.map((typeArgument) => {
                            const type = visitorContext.checker.getTypeFromTypeNode(typeArgument);
                            let typeNode = typeArgument;
                            if (typeArguments !== undefined && typeParameterTypes !== undefined) {
                                const index = typeParameterTypes.findIndex((typeParameterType) => typeParameterType === type);
                                if (index >= 0) {
                                    typeNode = typeArguments[index];
                                }
                            }
                            return typeNode;
                        });
                    const type = visitorContext.checker.getTypeAtLocation(heritageType.expression);
                    visitorContext.typeArgumentsStack.push(ts.createNodeArray(heritageTypeArguments));
                    const expression = type.symbol.declarations
                        .map((declaration) => visitDeclaration(declaration, accessor, visitorContext))
                        .reduce((condition, expression) =>
                            ts.createBinary(
                                condition,
                                ts.SyntaxKind.AmpersandAmpersandToken,
                                expression
                            )
                        );
                    conditions.push(expression);
                    visitorContext.typeArgumentsStack.pop();
                } else {
                    throw new Error('Expected heritage type expression to be an identifier.');
                }
            }
        }
    }

    for (const member of node.members) {
        if (ts.isPropertySignature(member)) {
            const memberAccessor = ts.createPropertyAccess(accessor, tsutils.getPropertyName(member.name));
            if (member.type !== undefined) {
                let typeNode = member.type;
                if (typeArguments !== undefined) {
                    const type = visitorContext.checker.getTypeFromTypeNode(member.type);
                    let matchedTypeArgumentIndex = -1;
                    if (typeParameterTypes !== undefined) {
                        matchedTypeArgumentIndex = typeParameterTypes.findIndex((typeParameterType) => typeParameterType === type);
                    }
                    if (matchedTypeArgumentIndex >= 0) {
                        typeNode = typeArguments[matchedTypeArgumentIndex];
                    }
                }
                // TODO: member optional
                conditions.push(visitTypeNode(typeNode, memberAccessor, visitorContext));
            }
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

function visitDeclaration(node: ts.Declaration, accessor: ts.Expression, visitorContext: VisitorContext): ts.Expression {
    const typeCheckFunctionAccessorTopLevel = visitorContext.typeCheckFunctionAccessorTopLevel;
    const typeArguments = visitorContext.typeArgumentsStack[visitorContext.typeArgumentsStack.length - 1];
    const type = visitorContext.checker.getTypeAtLocation(node);
    const fqn = visitorContext.checker.getFullyQualifiedName(type.symbol);
    const typeArgumentsPostfix = stringifyTypeNodes(typeArguments, visitorContext);
    const name = fqn + typeArgumentsPostfix;
    if (!(name in visitorContext.typeDefinitions)) {
        const accessor = ts.createIdentifier('object');
        let expression: ts.Expression;
        if (ts.isInterfaceDeclaration(node)) {
            expression = visitInterfaceDeclaration(node, accessor, visitorContext);
        } else if (ts.isTypeParameterDeclaration(node)) {
            throw new Error('Unbound type parameter: ' + node.getText() + ' at ' + reportNode(node));
        } else {
            throw new Error('Unsupported declaration kind: ' + node.kind);
        }
        visitorContext.typeCheckFunctionAccessorTopLevel = null;
        visitorContext.typeDefinitions[name] = constructArrowFunction(
            accessor,
            expression
        );
        visitorContext.typeCheckFunctionAccessorTopLevel = typeCheckFunctionAccessorTopLevel;
    }
    return ts.createCall(
        typeCheckFunctionAccessorTopLevel !== null
            ? typeCheckFunctionAccessorTopLevel
            : visitorContext.typeCheckFunctionAccessor,
        undefined,
        [
            accessor,
            ts.createStringLiteral(name)
        ]
    );
}

function visitTypeReferenceNode(node: ts.TypeReferenceNode, accessor: ts.Expression, visitorContext: VisitorContext): ts.Expression {
    const type = visitorContext.checker.getTypeFromTypeNode(node);
    visitorContext.typeArgumentsStack.push(node.typeArguments);
    const expression = type.symbol.declarations
        .map((declaration) => visitDeclaration(declaration, accessor, visitorContext))
        .reduce((condition, expression) => ts.createBinary(condition, ts.SyntaxKind.AmpersandAmpersandToken, expression));
    visitorContext.typeArgumentsStack.pop();
    return expression;
}

function visitLiteralTypeNode(node: ts.LiteralTypeNode, accessor: ts.Expression, visitorContext: VisitorContext) {
    if (ts.isStringLiteral(node.literal)) {
        return ts.createStrictEquality(accessor, ts.createStringLiteral(node.literal.text));
    } else {
        throw new Error('Unsupported LiteralTypeNode kind: ' + node.kind);
    }
}

export function visitTypeNode(node: ts.TypeNode, accessor: ts.Expression, visitorContext: VisitorContext) {
    /* if (node.kind === ts.SyntaxKind.AnyKeyword) {
        name = 'any';
    } else if (node.kind === ts.SyntaxKind.UnknownKeyword) {
        name = 'unknown';
    } else*/
    if (node.kind === ts.SyntaxKind.NumberKeyword) {
        return visitNumberKeyword(node, accessor, visitorContext);
        /*} else if (node.kind === ts.SyntaxKind.ObjectKeyword) {
            name = 'object';*/
    } else if (node.kind === ts.SyntaxKind.BooleanKeyword) {
        return visitBooleanKeyword(node, accessor, visitorContext);
    } else if (node.kind === ts.SyntaxKind.StringKeyword) {
        return visitStringKeyword(node, accessor, visitorContext);
        /*} else if (node.kind === ts.SyntaxKind.VoidKeyword) {
            name = 'void';
        } else if (node.kind === ts.SyntaxKind.UndefinedKeyword) {
            name = 'undefined';
        } else if (node.kind === ts.SyntaxKind.NullKeyword) {
            name = 'null';
        } else if (node.kind === ts.SyntaxKind.NeverKeyword) {
            name = 'never';
        }*/
    } else if (ts.isTypeReferenceNode(node)) {
        return visitTypeReferenceNode(node, accessor, visitorContext);
    } else if (ts.isLiteralTypeNode(node)) {
        return visitLiteralTypeNode(node, accessor, visitorContext);
    } else {
        throw new Error('Unsupported TypeNode kind: ' + node.kind);
    }
}
