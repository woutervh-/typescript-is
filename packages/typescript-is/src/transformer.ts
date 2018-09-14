import * as ts from 'typescript';
import * as path from 'path';
import { VisitorContext } from './visitor-context';
import { visitTypeNode } from './visitor';
import { compile } from './compiler';

export default function transformer(program: ts.Program): ts.TransformerFactory<ts.SourceFile> {
    const visitorContext: VisitorContext = {
        program,
        checker: program.getTypeChecker(),
        typeDefinitions: {},
        typeDefinitionsAccessor: ts.createIdentifier('symbols'),
        typeCheckFunctionAccessor: ts.createIdentifier('is'),
        typeCheckFunctionAccessorTopLevel: null,
        typeArgumentsStack: []
    };
    return (context: ts.TransformationContext) => (file: ts.SourceFile) => {
        if (path.resolve(file.fileName) === path.resolve(__dirname, '..', 'index.ts')) {
            return ts.updateSourceFileNode(file, compile(visitorContext));
        } else {
            return transformNodeAndChildren(file, program, context, visitorContext);
        }
    };
}

function transformNodeAndChildren(node: ts.SourceFile, program: ts.Program, context: ts.TransformationContext, visitorContext: VisitorContext): ts.SourceFile;
function transformNodeAndChildren(node: ts.Node, program: ts.Program, context: ts.TransformationContext, visitorContext: VisitorContext): ts.Node;
function transformNodeAndChildren(node: ts.Node, program: ts.Program, context: ts.TransformationContext, visitorContext: VisitorContext): ts.Node {
    return ts.visitEachChild(transformNode(node, visitorContext), (childNode) => transformNodeAndChildren(childNode, program, context, visitorContext), context);
}

function transformNode(node: ts.Node, visitorContext: VisitorContext): ts.Node {
    if (ts.isCallExpression(node)) {
        const signature = visitorContext.checker.getResolvedSignature(node);
        if (
            signature !== undefined
            && signature.declaration !== undefined
            && path.resolve(signature.declaration.getSourceFile().fileName) === path.resolve(path.join(__dirname, '..', 'index.ts'))
            && node.arguments.length === 1
            && node.typeArguments !== undefined
            && node.typeArguments.length === 1
        ) {
            const typeArgument = node.typeArguments[0];
            const accessor = node.arguments[0];
            return visitTypeNode(typeArgument, accessor, { ...visitorContext, typeCheckFunctionAccessorTopLevel: node.expression });
        }
    }
    return node;
}
