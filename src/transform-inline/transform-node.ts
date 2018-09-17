import * as path from 'path';
import * as ts from 'typescript';
import { VisitorContext } from './visitor-context';
import { visitType } from './visitor';

export function transformNode(node: ts.Node, visitorContext: VisitorContext): ts.Node {
    if (ts.isCallExpression(node)) {
        const signature = visitorContext.checker.getResolvedSignature(node);
        if (
            signature !== undefined
            && signature.declaration !== undefined
            && path.resolve(signature.declaration.getSourceFile().fileName) === path.resolve(path.join(__dirname, '..', '..', 'index.d.ts'))
            && node.arguments.length === 1
            && node.typeArguments !== undefined
            && node.typeArguments.length === 1
        ) {
            const typeArgument = node.typeArguments[0];
            const type = visitorContext.checker.getTypeFromTypeNode(typeArgument);
            const accessor = ts.createIdentifier('object');
            return ts.createCall(
                ts.createArrowFunction(
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
                        ts.createReturn(visitType(type, accessor, visitorContext))
                    ])
                ),
                undefined,
                node.arguments
            );
        }
    }
    return node;
}
