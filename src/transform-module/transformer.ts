import * as ts from 'typescript';
import * as path from 'path';
import { VisitorContext } from './visitor-context';
import { compile } from './compiler';

export interface Options {
    outFile?: string;
}

export default function transformer(program: ts.Program, options?: Options): ts.TransformerFactory<ts.SourceFile> {
    if (options === undefined) {
        throw new Error('Options are required.');
    }
    if (options.outFile === undefined) {
        throw new Error('Option outFile is required.');
    }
    const outFile = options.outFile;
    const visitorContext: VisitorContext = {
        program,
        checker: program.getTypeChecker(),
        typeDefinitions: {},
        typeDefinitionsAccessor: ts.createIdentifier('symbols'),
        typeCheckFunctionAccessor: ts.createIdentifier('is'),
        typeCheckFunctionAccessorTopLevel: null,
        typeArgumentsStack: []
    };
    let remaining = program.getRootFileNames().length;
    return (context: ts.TransformationContext) => {
        return (file: ts.SourceFile) => {
            const result = transformNodeAndChildren(file, program, context, visitorContext);
            if (--remaining === 0) {
                const sourceFile = ts.createSourceFile(
                    outFile,
                    '',
                    ts.ScriptTarget.ES2016,
                    undefined,
                    ts.ScriptKind.JS
                );
                const newSourceFile = ts.updateSourceFileNode(sourceFile, compile(visitorContext));
                const printer = ts.createPrinter({
                    newLine: ts.NewLineKind.LineFeed
                });
                const result = printer.printFile(newSourceFile);
                ts.sys.writeFile(newSourceFile.fileName, result);
            }
            return result;
        };
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
            && path.resolve(signature.declaration.getSourceFile().fileName) === path.resolve(path.join(__dirname, '..', '..', 'index.d.ts'))
            && node.arguments.length === 1
            && node.typeArguments !== undefined
            && node.typeArguments.length === 1
        ) {
            // const typeArgument = node.typeArguments[0];
            // const accessor = node.arguments[0];
            // return visitTypeNode(typeArgument, accessor, { ...visitorContext, typeCheckFunctionAccessorTopLevel: node.expression });
            return node;
        }
    }
    return node;
}
