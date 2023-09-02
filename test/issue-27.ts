import * as path from 'path';
import * as ts from 'typescript';
import { transformNode } from '../lib/transform-inline/transform-node';
import { PartialVisitorContext } from '../lib/transform-inline/visitor-context';

/**
 * https://github.com/woutervh-/typescript-is/issues/27
 */

const configFilename = path.resolve('tsconfig.json');
const content = ts.sys.readFile(configFilename);
if (content === undefined) {
    throw new Error('Could not read config file.');
}
const configFile = ts.parseConfigFileTextToJson(configFilename, content);
const configParseResult = ts.parseJsonConfigFileContent(configFile.config, ts.sys, path.dirname(configFilename), {}, path.basename(configFilename));
configParseResult.options.noEmit = true;
delete configParseResult.options.out;
delete configParseResult.options.outDir;
delete configParseResult.options.outFile;
delete configParseResult.options.declaration;

describe('visitor', () => {
    describe('visitor test-fixtures/issue-27.ts', () => {
        const inFile = path.resolve(__dirname, '..', 'test-fixtures', 'issue-27.ts');
        const program = ts.createProgram([inFile], configParseResult.options);

        const visitorContext: PartialVisitorContext = {
            checker: program.getTypeChecker(),
            program,
            compilerOptions: program.getCompilerOptions(),
            options: {
                ignoreClasses: false,
                ignoreMethods: true,
                functionBehavior: 'error',
                shortCircuit: false,
                disallowSuperfluousObjectProperties: false,
                transformNonNullExpressions: false,
                emitDetailedErrors: 'auto'
            },
            typeMapperStack: [],
        previousTypeReference: null,
        canonicalPaths: new Map()
    };

        function visitNodeAndChildren(node: ts.Node) {
            ts.forEachChild(transformNode(node, visitorContext), visitNodeAndChildren);
        }

        it('should not throw an error for lambda functions', () => {
            visitNodeAndChildren(program.getSourceFile(inFile)!);
        });
    });
});
