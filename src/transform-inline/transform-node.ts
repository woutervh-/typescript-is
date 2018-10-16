import * as path from 'path';
import * as ts from 'typescript';
import { VisitorContext } from './visitor-context';
import { visitType, visitUndefinedOrType } from './visitor';

function createArrowFunction(accessor: ts.Identifier, type: ts.Type, optional: boolean, visitorContext: VisitorContext, isAssert: boolean) {
    const expression = optional
        ? visitUndefinedOrType(type, accessor, visitorContext)
        : visitType(type, accessor, visitorContext);

    return ts.createArrowFunction(
        undefined,
        undefined,
        [
            ts.createParameter(
                undefined,
                undefined,
                undefined,
                accessor,
                undefined,
                ts.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword)
            )
        ],
        undefined,
        undefined,
        ts.createBlock([
            isAssert
                ? ts.createIf(
                    ts.createLogicalNot(expression),
                    ts.createThrow(
                        ts.createNew(
                            ts.createIdentifier('Error'),
                            undefined,
                            [
                                ts.createStringLiteral('Type assertion failed.')
                            ]
                        )
                    ),
                    ts.createReturn(accessor)
                )
                : ts.createReturn(expression)
        ])
    );
}

function transformDecorator(node: ts.Decorator, parameterType: ts.Type, optional: boolean, visitorContext: VisitorContext): ts.Decorator {
    if (ts.isCallExpression(node.expression)) {
        const signature = visitorContext.checker.getResolvedSignature(node.expression);
        if (
            signature !== undefined
            && signature.declaration !== undefined
            && path.resolve(signature.declaration.getSourceFile().fileName) === path.resolve(path.join(__dirname, '..', '..', 'index.d.ts'))
            && node.expression.arguments.length <= 1
        ) {
            const accessor = ts.createIdentifier('object');
            const arrowFunction: ts.Expression = createArrowFunction(accessor, parameterType, optional, visitorContext, false);
            const expression = ts.updateCall(
                node.expression,
                node.expression.expression,
                undefined,
                [arrowFunction].concat(node.expression.arguments)
            );
            return ts.updateDecorator(
                node,
                expression
            );
        }
    }
    return node;
}

export function transformNode(node: ts.Node, visitorContext: VisitorContext): ts.Node {
    if (ts.isParameter(node) && node.type !== undefined && node.decorators !== undefined) {
        const type = visitorContext.checker.getTypeFromTypeNode(node.type);
        const required = !node.initializer && !node.questionToken;
        const mappedDecorators = node.decorators.map((decorator) => transformDecorator(decorator, type, !required, visitorContext));
        return ts.updateParameter(
            node,
            mappedDecorators,
            node.modifiers,
            node.dotDotDotToken,
            node.name,
            node.questionToken,
            node.type,
            node.initializer
        );
    } else if (ts.isCallExpression(node)) {
        const signature = visitorContext.checker.getResolvedSignature(node);
        if (
            signature !== undefined
            && signature.declaration !== undefined
            && path.resolve(signature.declaration.getSourceFile().fileName) === path.resolve(path.join(__dirname, '..', '..', 'index.d.ts'))
            && node.typeArguments !== undefined
            && node.typeArguments.length === 1
        ) {
            const name = visitorContext.checker.getTypeAtLocation(signature.declaration).symbol.name;
            const isCreate = name === 'createIs' || name === 'createAssertType';
            const isAssert = name === 'assertType' || name === 'createAssertType';
            const typeArgument = node.typeArguments[0];
            const type = visitorContext.checker.getTypeFromTypeNode(typeArgument);
            const accessor = ts.createIdentifier('object');

            if (!(isCreate && node.arguments.length === 0) && !(!isCreate && node.arguments.length === 1)) {
                throw new Error('Calls to `is` and `assertType` should have one argument, calls to `createIs` and `createAssertType` should have no arguments.');
            }

            const arrowFunction = createArrowFunction(accessor, type, false, visitorContext, isAssert);

            if (isCreate) {
                return arrowFunction;
            } else {
                return ts.createCall(
                    arrowFunction,
                    undefined,
                    node.arguments
                );
            }
        }
    }
    return node;
}
