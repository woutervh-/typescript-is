import * as ts from 'typescript';
import NestedError = require('nested-error-stacks');
import { PartialVisitorContext } from './visitor-context';
import { transformNode } from './transform-node';

function getFunctionBehavior(options?: { [Key: string]: unknown }): PartialVisitorContext['options']['functionBehavior'] {
    if (options) {
        if (options.functionBehavior) {
            if (options.functionBehavior === 'ignore' || options.functionBehavior === 'basic') {
                return options.functionBehavior;
            }
        } else {
            if (!!options.ignoreFunctions) {
                return 'ignore';
            }
        }
    }
    return 'error';
}

export default function transformer(program: ts.Program, options?: { [Key: string]: unknown }): ts.TransformerFactory<ts.SourceFile> {
    if (options && options.verbose) {
        console.log(`typescript-is: transforming program with ${program.getSourceFiles().length} source files; using TypeScript ${ts.version}.`);
    }

    const visitorContext: PartialVisitorContext = {
        program,
        checker: program.getTypeChecker(),
        compilerOptions: program.getCompilerOptions(),
        options: {
            shortCircuit: !!(options && options.shortCircuit),
            ignoreClasses: !!(options && options.ignoreClasses),
            ignoreMethods: !!(options && options.ignoreMethods),
            functionBehavior: getFunctionBehavior(options),
            disallowSuperfluousObjectProperties: !!(options && options.disallowSuperfluousObjectProperties),
            transformNonNullExpressions: !!(options && options.transformNonNullExpressions)
        },
        typeMapperStack: [],
        previousTypeReference: null
    };
    return (context: ts.TransformationContext) => (file: ts.SourceFile) => transformNodeAndChildren(file, program, context, visitorContext);
}

function transformNodeAndChildren(node: ts.SourceFile, program: ts.Program, context: ts.TransformationContext, visitorContext: PartialVisitorContext): ts.SourceFile;
function transformNodeAndChildren(node: ts.Node, program: ts.Program, context: ts.TransformationContext, visitorContext: PartialVisitorContext): ts.Node;
function transformNodeAndChildren(node: ts.Node, program: ts.Program, context: ts.TransformationContext, visitorContext: PartialVisitorContext): ts.Node {
    let transformedNode: ts.Node;
    try {
        transformedNode = transformNode(node, visitorContext);
    } catch (error) {
        const sourceFile = node.getSourceFile();
        const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.pos);
        throw new NestedError(`Failed to transform node at: ${sourceFile.fileName}:${line + 1}:${character + 1}`, error);
    }
    return ts.visitEachChild(transformedNode, (childNode) => transformNodeAndChildren(childNode, program, context, visitorContext), context);
}
