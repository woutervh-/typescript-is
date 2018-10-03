import * as ts from 'typescript';
import NestedError = require('nested-error-stacks');
import { VisitorContext } from './visitor-context';
import { transformNode } from './transform-node';

export default function transformer(program: ts.Program): ts.TransformerFactory<ts.SourceFile> {
    const visitorContext: VisitorContext = {
        program,
        checker: program.getTypeChecker(),
        typeMapperStack: [],
        mode: {
            type: 'type-check'
        }
    };
    return (context: ts.TransformationContext) => (file: ts.SourceFile) => transformNodeAndChildren(file, program, context, visitorContext);
}

function transformNodeAndChildren(node: ts.SourceFile, program: ts.Program, context: ts.TransformationContext, visitorContext: VisitorContext): ts.SourceFile;
function transformNodeAndChildren(node: ts.Node, program: ts.Program, context: ts.TransformationContext, visitorContext: VisitorContext): ts.Node;
function transformNodeAndChildren(node: ts.Node, program: ts.Program, context: ts.TransformationContext, visitorContext: VisitorContext): ts.Node {
    try {
        return ts.visitEachChild(transformNode(node, visitorContext), (childNode) => transformNodeAndChildren(childNode, program, context, visitorContext), context);
    } catch (error) {
        const sourceFile = node.getSourceFile();
        const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.pos);
        throw new NestedError(`Failed to transform node at: ${sourceFile.fileName}:${line + 1}:${character + 1}`, error);
    }
}
