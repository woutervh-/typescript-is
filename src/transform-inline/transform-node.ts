import * as path from 'path';
import * as ts from 'typescript';
import { VisitorContext } from './visitor-context';
import { visitTypeNode } from './visitor';

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
            const accessor = node.arguments[0];
            return visitTypeNode(typeArgument, accessor, visitorContext);
        }
    }
    return node;
}
