import * as path from 'path';
import * as ts from 'typescript';
import { VisitorContext } from './visitor-context';
import { visitType } from './visitor';

function transformDecorator(node: ts.Decorator, parameterType: ts.Type, visitorContext: VisitorContext): ts.Decorator {
    const decoratorType = visitorContext.checker.getTypeAtLocation(node.expression);
    if (
        decoratorType.symbol.name === 'AssertParameter'
        && path.resolve(decoratorType.symbol.valueDeclaration.getSourceFile().fileName) === path.resolve(path.join(__dirname, '..', '..', 'index.d.ts'))
    ) {
        const accessor = ts.createIdentifier('object');
        const expression = ts.createCall(
            node.expression,
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
                            accessor
                        )
                    ],
                    undefined,
                    undefined,
                    ts.createBlock([
                        ts.createReturn(visitType(parameterType, accessor, visitorContext))
                    ])
                )
            ]
        );
        return ts.updateDecorator(
            node,
            expression
        );
    }
    return node;
}

export function transformNode(node: ts.Node, visitorContext: VisitorContext): ts.Node {
    if (ts.isParameter(node) && node.type !== undefined && node.decorators !== undefined) {
        const type = visitorContext.checker.getTypeFromTypeNode(node.type);
        const mappedDecorators = node.decorators.map((decorator) => transformDecorator(decorator, type, visitorContext));
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
            const create = name === 'createIs' || name === 'createAssertType';
            const assert = name === 'assertType' || name === 'createAssertType';
            const typeArgument = node.typeArguments[0];
            const type = visitorContext.checker.getTypeFromTypeNode(typeArgument);
            const accessor = ts.createIdentifier('object');

            if (!(create && node.arguments.length === 0) && !(!create && node.arguments.length === 1)) {
                throw new Error('Calls to `is` and `assertType` should have one argument, calls to `createIs` and `createAssertType` should have no arguments.');
            }

            const arrowFunction = ts.createArrowFunction(
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
                    assert
                        ? ts.createIf(
                            ts.createLogicalNot(visitType(type, accessor, visitorContext)),
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
                        : ts.createReturn(visitType(type, accessor, visitorContext))
                ])
            );

            if (create) {
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
