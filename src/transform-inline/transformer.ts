import * as ts from 'typescript';
import { VisitorContext } from './visitor-context';
import { transformNode } from './transform-node';

export default function transformer(program: ts.Program): ts.TransformerFactory<ts.SourceFile> {
    const visitorContext: VisitorContext = {
        program,
        checker: program.getTypeChecker(),
        typeArgumentsStack: [],
        typeMapperStack: []
    };
    return (context: ts.TransformationContext) => (file: ts.SourceFile) => transformNodeAndChildren(file, program, context, visitorContext);
}

function transformNodeAndChildren(node: ts.SourceFile, program: ts.Program, context: ts.TransformationContext, visitorContext: VisitorContext): ts.SourceFile;
function transformNodeAndChildren(node: ts.Node, program: ts.Program, context: ts.TransformationContext, visitorContext: VisitorContext): ts.Node;
function transformNodeAndChildren(node: ts.Node, program: ts.Program, context: ts.TransformationContext, visitorContext: VisitorContext): ts.Node {
    return ts.visitEachChild(transformNode(node, visitorContext), (childNode) => transformNodeAndChildren(childNode, program, context, visitorContext), context);
}
