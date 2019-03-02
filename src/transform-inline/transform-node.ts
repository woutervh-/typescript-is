import * as path from 'path';
import * as ts from 'typescript';
import { VisitorContext, PartialVisitorContext } from './visitor-context';
import { visitType, visitUndefinedOrType } from './visitor-type-check';
import { sliceMapValues } from './utils';

const objectIdentifier = ts.createIdentifier('object');
const pathIdentifier = ts.createIdentifier('path');

function createArrowFunction(type: ts.Type, optional: boolean, visitorContext: PartialVisitorContext, isAssert: boolean) {
    const functionMap: VisitorContext['functionMap'] = new Map();
    const functionNames: VisitorContext['functionNames'] = new Set();
    const functionName = optional
        ? visitUndefinedOrType(type, { ...visitorContext, functionNames, functionMap })
        : visitType(type, { ...visitorContext, functionNames, functionMap });

    const errorIdentifier = ts.createIdentifier('error');
    const declarations = sliceMapValues(functionMap);

    return ts.createArrowFunction(
        undefined,
        undefined,
        [
            ts.createParameter(
                undefined,
                undefined,
                undefined,
                objectIdentifier,
                undefined,
                ts.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword)
            )
        ],
        undefined,
        undefined,
        ts.createBlock([
            ts.createVariableStatement(
                [ts.createModifier(ts.SyntaxKind.ConstKeyword)],
                [ts.createVariableDeclaration(pathIdentifier, undefined, ts.createArrayLiteral([ts.createStringLiteral('$')]))]
            ),
            ...declarations,
            ts.createVariableStatement(
                [ts.createModifier(ts.SyntaxKind.ConstKeyword)],
                [ts.createVariableDeclaration(errorIdentifier, undefined, ts.createCall(ts.createIdentifier(functionName), undefined, [objectIdentifier]))]
            ),
            isAssert
                ? ts.createIf(
                    errorIdentifier,
                    ts.createThrow(ts.createNew(ts.createIdentifier('Error'), undefined, [errorIdentifier])),
                    ts.createReturn(objectIdentifier)
                )
                : ts.createReturn(ts.createStrictEquality(errorIdentifier, ts.createNull()))
        ])
    );
}

function transformDecorator(node: ts.Decorator, parameterType: ts.Type, optional: boolean, visitorContext: PartialVisitorContext): ts.Decorator {
    if (ts.isCallExpression(node.expression)) {
        const signature = visitorContext.checker.getResolvedSignature(node.expression);
        if (
            signature !== undefined
            && signature.declaration !== undefined
            && path.resolve(signature.declaration.getSourceFile().fileName) === path.resolve(path.join(__dirname, '..', '..', 'index.d.ts'))
            && node.expression.arguments.length <= 1
        ) {
            const arrowFunction: ts.Expression = createArrowFunction(parameterType, optional, visitorContext, false);
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

export function transformNode(node: ts.Node, visitorContext: PartialVisitorContext): ts.Node {
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

            if (!(isCreate && node.arguments.length === 0) && !(!isCreate && node.arguments.length === 1)) {
                throw new Error('Calls to `is` and `assertType` should have one argument, calls to `createIs` and `createAssertType` should have no arguments.');
            }

            const arrowFunction = createArrowFunction(type, false, visitorContext, isAssert);

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
